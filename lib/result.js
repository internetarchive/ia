import * as Errors from './errors.js'

class Result {
  constructor(input) {
    if (typeof input === 'object' && input.identifier !== undefined) {
      Object.assign(this, input)
    } else if (input !== '') {
      this.identifier = input
    } else {
      throw new TypeError('Result can only be used with a search doc or identifier string.')
    }
    this.metadataURL = `https://archive.org/metadata/${this.identifier}`
    this.files = []
  }

  async metadata() {
    const response = await fetch(this.metadataURL)

    if (!response.ok) {
      throw new Error(`an error occured fetching metadata: ${response}`)
    }

    const data = await response.json()

    if (Object.keys(data).length === 0) {
      throw new Errors.NullMetadataError(`no metadata exists for ${this.identifier}`)
    }

    if (typeof data.metadata.subject === 'string') {
      data.metadata.subject = data.metadata.subject.split(';')
    }
    Object.assign(this, data.metadata)
    this.files = data.files
    this.downloadURL = `https://${data.server}${data.dir}`
  }

  * download(start = 0, end = Infinity) {
    const len = Math.min(Object.keys(this.files).length, end)

    if (len === 0 || start > len) {
      throw new Error(`out of bounds download start: ${start} end: ${end}`)
    }
    if (this.downloadURL === undefined) {
      throw new Error('must run metadata before downloading')
    }

    for (let i = start; i < len; i += 1) {
      yield fetch(`${this.downloadURL}/${this.files[i].name}`).then((response) => {
        if (!response.ok) {
          throw new Error(`error occured while downloading file ${response}`)
        }
        return response.blob()
      }).then(async (blob) => {
        const current = Array.from(new Uint8Array(
          await blob.arrayBuffer().then(
            (buffer) => crypto.subtle.digest('SHA-1', buffer),
          ),
        )).map((b) => b.toString(16).padStart(2, '0')).join('')
        const desired = this.files[i].sha1
        if (current === desired || desired === undefined) {
          return Promise.resolve(blob)
        }
        throw new Errors.BlobSHAMismatchError(`downloaded file ${this.files[i].name} SHA-1 does not match`, desired, current)
      })
    }
    return len - start
  }

  renderCallback(start = 0, end = Infinity, cb = (blob) => blob) {
    this.metadata().then(() => {
      for (const blobProm of this.download(start, end)) {
        blobProm.then((blob) => cb(blob))
      }
    })
  }
}

export default Result
