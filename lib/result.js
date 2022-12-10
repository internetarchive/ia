import * as Errors from './errors.js'
import File from './file.js'

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
    this.detailsURL = `https://archive.org/details/${this.identifier}`
    this.imageURL = `https://archive.org/img/${this.identifier}`
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
    this.downloadURL = `https://${data.server}${data.dir}`
    data.files.array.forEach((file) => {
      this.files.push(File(this.downloadURL, file))
    })
  }
}

export default Result
