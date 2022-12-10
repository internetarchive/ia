import * as Errors from './errors.js'

class File {
  constructor(url, file) {
    this.url = url
    // eslint-disable-next-line no-array-constructor
    Array('name', 'sha1', 'size').forEach((field) => {
      if (file[field] === undefined) {
        throw TypeError(`an error occured casting file metadata, field ${field} is missing`)
      }
    })
    Object.assign(this, file)
  }

  async download(from = 0) {
    const request = new Request(`${this.downloadURL}/${this.name}`)

    if (this.size <= from) {
      throw new Errors.ResumeError('file cannot resume download', from)
    } else if (from > 0) {
      request.headers = new Headers().append('Range', `bytes=${from}`)
    }

    if (this.url === undefined) {
      throw new Error('file is missing url')
    }

    const stream = await fetch(request).then((response) => {
      if (!response.ok) {
        throw new Error(`error occured while downloading file ${response}`)
      }
      return response.body
    })

    return { stream, sha1: this.sha1 }
  }
}

export default File
