import * as SparkMD5 from 'spark-md5'
import * as Errors from './errors.js'

class File {
  constructor(url, file) {
    this.url = url
    const fields = ['name', 'md5']
    fields.forEach((field) => {
      if (file[field] === undefined) {
        throw TypeError(`an error occured casting file metadata, field ${field} is missing`)
      }
    })
    Object.assign(this, file)
  }

  async download(from = 0) {
    const request = new Request(`${this.downloadURL}/${this.name}`)

    if (this.size !== undefined) {
      if (this.size <= from) {
        throw new Errors.ResumeError('file cannot resume download', from)
      } else if (from > 0) {
        request.headers = new Headers().append('Range', `bytes=${from}`)
      }
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

    if (this.md5 === undefined || from > 0) {
      return { stream, md5: Promise.resolve(true) }
    }

    let passthrough
    const md5 = new Promise((resolve, reject) => {
      const sparkMD5 = new SparkMD5()
      // eslint-disable-next-line compat/compat
      passthrough = new TransformStream({
        transform(chunk, controller) {
          sparkMD5.appendBinary(chunk)
          controller.enqueue(chunk)
        },
        flush(controller) {
          controller.terminate()
          if (sparkMD5.end() === this.md5) {
            resolve(true)
          }
          reject(sparkMD5.getState())
        },
      })
    })

    return { stream: stream.pipeThrough(passthrough), md5 }
  }
}

export default File
