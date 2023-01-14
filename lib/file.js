// eslint-disable-next-line import/no-unresolved
import SparkMD5 from 'https://ga.jspm.io/npm:spark-md5@3.0.2/spark-md5.js'
import * as Errors from './errors.js'
import Result from './result.js'

class File {
  constructor(file, parent = new Result()) {
    if (!(parent instanceof Result)) {
      throw TypeError('parent is not an instance of Result')
    }
    this.parent = parent
    const fields = ['name', 'md5']
    fields.forEach((field) => {
      if (file[field] === undefined) {
        throw TypeError(`an error occured casting file metadata, field ${field} is missing`)
      }
    })
    Object.assign(this, file)
  }

  async download(from = 0) {
    const headers = new Headers()
    if (this.size !== undefined) {
      if (this.size <= from) {
        throw new Errors.ResumeError('file cannot resume download', from)
      } else if (from > 0) {
        headers.append('Range', `bytes=${from}-`)
      }
    }

    const request = new Request(`${this.parent.downloadURL}/${this.name}`, {
      method: 'GET',
      headers,
    })

    const stream = await fetch(request).then(async (response) => {
      if (!response.ok) {
        await response.body.cancel()
        throw new Error(`error occured while downloading file ${response.status}`)
      }
      return response.body
    })

    if (this.md5 === undefined || from > 0) {
      return { md5: Promise.resolve(false), stream }
    }

    let passthrough
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

    return { md5, stream: stream.pipeThrough(passthrough) }
  }
}

export default File
