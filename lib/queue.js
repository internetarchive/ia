/* eslint-disable max-classes-per-file */
import * as Errors from './errors.js'
import File from './file.js'
import Result from './result.js'

class MetaQueue {
  constructor(parallel = 10, retry = 5, cb = (metadata) => metadata, ...results) {
    if (parallel < 1 || retry < 1) {
      throw TypeError('cannot use negative values for parallel or retry')
    }
    if (typeof cb !== 'function') {
      throw TypeError('cb must be a type of function')
    }
    if (!Array.isArray(results) || results.length < 1) {
      throw TypeError('results must be an array of at least one result object')
    }

    this.results = results
    this.parallel = parallel
    this.cb = cb

    this.retryNum = retry
    this.retryMap = new Map()

    this.metaErrorMap = new Map()
  }

  retry(name) {
    const current = (this.retryMap.get(name) ?? this.retryMap.set(name, 0))
    if (current >= this.retryNum) {
      return false
    }
    this.retryMap.set(name, current + 1)
    return true
  }

  loadNext() {
    if (this.results.length === 0) {
      return Promise.resolve()
    }
    const result = this.results.pop()
    if (!(result instanceof Result)) {
      this.metaErrorMap.set(result, new TypeError('is not a Result object'))
      return Promise.resolve(this.loadNext())
    }
    return ((this.retryMap.get(result.identifier) === 0)
      ? result.metadata() : new Promise((resolve) => {
        setTimeout(resolve, 10 ** this.retryMap.get(result.name))
      }).then(() => result.metadata()))
      .catch((reason) => {
        if (!(
          reason instanceof Errors.NullMetadataError ||
          reason instanceof TypeError
        ) && this.retry(result.name)) {
          this.results.unshift(result)
        } else {
          this.metaErrorMap.set(result.identifier, reason)
        }
      })
      .finally(() => {
        this.cb(result)
        return this.loadNext()
      })
  }

  update() {
    const queue = []
    const len = Math.min(this.parallel, this.results.length)
    for (let x = 0; x < len; x++) {
      queue.push(this.loadNext())
    }
    return Promise.allSettled(queue)
  }
}

class DownloadQueue extends MetaQueue {
  constructor(
      parallel = 10,
      retry = 5,
      cb = (file, stream, md5) => [file, stream, md5],
      ...results
  ) {
    if (typeof cb !== 'function') {
      throw TypeError('cb must be a type of function')
    }
    super(parallel, retry, (metadata) => metadata, ...results)

    this.dcb = cb
    this.files = []

    this.downloadErrorMap = new Map()
  }

  downloadNext(resumeMap = { undefined: 0 }) {
    if (this.files.length === 0) {
      return Promise.resolve(true)
    }
    const file = this.files.pop()
    if (!(file instanceof File)) {
      this.metaErrorMap.set(file, new TypeError('is not a File object'))
      return Promise.resolve(this.downloadNext())
    }
    let from = 0
    const fullName = `${file.parent.identifier}/${file.name}`
    if (resumeMap[fullName] !== undefined) {
      from = resumeMap[fullName]
    }
    return ((this.retryMap.get(file.name) === 0) ? file.download(from) : new Promise((resolve) => {
      setTimeout(resolve, 10 ** this.retryMap.get(file.name))
    }).then(() => file.download(from)))
      .then((streamObj) => this.dcb(file, streamObj.stream, streamObj.md5))
      .catch((reason) => {
        if (!(
          reason instanceof Errors.ResumeError ||
          reason instanceof TypeError
        ) && this.retry(file.name)) {
          this.files.unshift(file)
        } else {
          this.downloadErrorMap.set(fullName, reason)
        }
      })
      .finally(() => this.downloadNext(resumeMap))
  }

  async download(resumeMap = { undefined: 0 }, filter = (file) => file) {
    if (typeof resumeMap !== 'object') {
      throw TypeError('resumeMap must be an object')
    }
    if (typeof filter !== 'function') {
      throw TypeError('filter must be a type of function')
    }
    this.cb = (metadata) => {
      metadata.files.forEach((file) => {
        if (filter(file) !== false) {
          this.files.push(file)
        }
      })
    }
    await this.update()
    const queue = []
    const len = Math.min(this.parallel, this.files.length)
    for (let x = 0; x < len; x++) {
      queue.push(this.downloadNext(resumeMap))
    }
    return Promise.allSettled(queue)
  }
}

export { MetaQueue, DownloadQueue }
