/* eslint-disable no-param-reassign */
import rfc6902 from 'https://ga.jspm.io/npm:rfc6902@5.0.1/index.js'
import * as Errors from './errors.js'
import File from './file.js'
import * as Fields from './fields.js'

class Result {
  constructor(input) {
    if (typeof input === 'object' && input.identifier !== undefined) {
      Object.assign(this, input)
    } else if (typeof input === 'string' && input.length > 0) {
      this.identifier = input
    } else {
      throw new TypeError('Result can only be used with a search doc or identifier string.')
    }
    this.metadataURL = `https://archive.org/metadata/${this.identifier}`
    this.detailsURL = `https://archive.org/details/${this.identifier}`
    this.imageURL = `https://archive.org/services/img/${this.identifier}`
    this.files = []
  }

  async metadata() {
    const response = await fetch(this.metadataURL)

    if (!response.ok) {
      await response.body.cancel()
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
    this.downloadURL = `http://${data.server}${data.dir}`
    data.files.forEach((file) => {
      this.files.push(new File(file, this))
    })
  }

  async apply(diff) {
    if (!(diff instanceof Result)) {
      return new TypeError('diff must be an instance of Result')
    }

    const source = this
    const dest = diff
    // eslint-disable-next-line no-array-constructor
    Array(source, dest).forEach((obj) => {
      delete obj.metadataURL
      delete obj.detailsURL
      delete obj.imageURL
      delete obj.downloadURL
      obj.files.forEach((v, k, a) => {
        a[k] = v
        delete a[k].parent
        Object.keys(a[k]).forEach((fv) => {
          if (!Fields.Results.has(fv)) {
            throw new Errors.FileField('bad field in file', fv)
          }
        })
      })
      Object.keys(obj).forEach((v) => {
        if (v !== 'files' && !Fields.Results.has(v)) {
          throw new Errors.ResultField('bad field in result', v)
        }
      })
    })

    const patch = rfc6902.createPatch(
      source,
      dest,
    )
  }
}

export default Result
