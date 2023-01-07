// eslint-disable-next-line max-classes-per-file
class MetaQueue {
  constructor(parallel = 10, retry = 5, cb = (metadata) => metadata, results = []) {
    this.results = results
    this.parallel = parallel
    this.cb = cb

    this.retryNum = retry
    this.retryMap = {}

    this.metaErrorMap = {}
  }

  metaErrors() {
    return this.metaErrorMap
  }

  retry(name) {
    const current = (this.retryMap[name] ?? 0)
    if (current >= this.retryNum) {
      return false
    }
    this.retryMap[name] = current + 1
    return true
  }

  loadNext() {
    if (this.results.length === 0) {
      return Promise.resolve()
    }
    const result = this.results.pop()
    return result.metadata()
      .catch((reason) => {
        if (this.retry(result.name)) {
          this.results.unshift(result)
        } else {
          this.metaErrorMap[result] = reason
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
  constructor(parallel = 10, retry = 5, cb = (file, size, md5) => [file, size, md5], ...results) {
    super(parallel, retry, undefined, results)

    this.dcb = cb
    this.files = []

    this.downloadErrorMap = {}
  }

  downloadErrors() {
    return this.downloadErrorMap
  }

  downloadNext(resumeMap = { undefined: 0 }) {
    if (this.files.length === 0) {
      return Promise.resolve(true)
    }
    const file = this.files.pop()
    let from = 0
    if (resumeMap[file.name] !== undefined) {
      from = resumeMap[file.name]
    }
    return file.download()
      .then((streamObj) => this.dcb(streamObj.stream, streamObj.size, streamObj.md5))
      .catch((reason) => {
        if (this.retry(file.name)) {
          this.files.unshift(file)
        } else {
          this.downloadErrorMap[file] = reason
        }
      })
      .finally(() => this.downloadNext(from))
  }

  async download(resumeMap = { undefined: 0 }, filter = (file) => file) {
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
