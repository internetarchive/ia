import SparkMD5 from 'spark-md5'
import * as Errors from './errors.js'

class File {
  constructor(file, url) {
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
    const request = new Request(`${this.url}/${this.name}`)

    if (this.size !== undefined) {
      if (this.size <= from) {
        throw new Errors.ResumeError('file cannot resume download', from)
      } else if (from > 0) {
        request.headers = new Headers().append('Range', `bytes=${from}`)
      }
    }

    const stream = await fetch(request).then((response) => {
      if (!response.ok) {
        throw new Error(`error occured while downloading file ${response}`)
      }
      return response.body
    })

    if (this.md5 === undefined || from > 0) {
      return { stream, size: this.size, md5: Promise.resolve(true) }
    }

    // eslint-disable-next-line compat/compat
    let passthrough = new TransformStream()
    const upperMD5 = this.md5
    const md5 = new Promise((resolve) => {
      const hash = new SparkMD5.ArrayBuffer()
      // eslint-disable-next-line compat/compat
      passthrough = new TransformStream({
        transform(chunk, controller) {
          hash.append(chunk)
          controller.enqueue(chunk)
        },
        flush(controller) {
          controller.terminate()
          const final = hash.end()
          if (final === upperMD5) {
            resolve(true)
          }
          resolve(false)
        },
      })
    })

    return { stream: stream.pipeThrough(passthrough), size: this.size, md5 }
  }
}

export default File
