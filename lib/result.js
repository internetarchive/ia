import * as Errors from './errors.js'
import Retry from './retry.js'

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
    this.retry = 5
  }

  async metadata() {
    const cb = async () => {
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

      return data
    }
    const data = await Retry(0, this.retry, cb, [Errors.NullMetadataError])

    Object.assign(this, data.metadata)
    this.files = data.files
    this.downloadURL = `http://${data.server}${data.dir}`
  }

  * download(start = 0, end = Infinity) {
    const len = Math.min(Object.keys(this.files).length, end)
    let count = 0

    if (len === 0 || start > len) {
      throw new Error(`out of bounds download start: ${start} end: ${end}`)
    }
    if (this.downloadURL === undefined) {
      throw new Error('must run metadata before downloading')
    }

    for (let i = start; i < len; i += 1) {
      count += 1
      const cb = () => fetch(`${this.downloadURL}/${this.files[i].name}`).then((response) => {
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
      yield Retry(0, this.retry, cb, [Errors.BlobSHAMismatchError])
    }
    return count
  }

  renderCallback(start = 0, end = Infinity, cb = (blob) => blob) {
    this.metadata.then(() => {
      for (const blobProm of this.download(start, end)) {
        blobProm.then((blob) => cb(blob))
      }
    })
  }
}

export default Result
