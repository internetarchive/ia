// eslint-disable-next-line max-classes-per-file
class MetaQueue {
  constructor(parallel = 10, retry = 5, cb = (metadata) => metadata, results = []) {
    this.results = results
    this.parallel = parallel
    this.cb = cb

    this.retry = retry
    this.retryMap = {}
  }

  retry(name) {
    const current = (this.retryMap[name] ?? 1)
    if (current >= this.retry - 1) {
      throw new Error(`retry limit reached for ${name}`)
    }
    this.retryMap[name] = current + 1
  }

  loadNext() {
    if (this.results.length === 0) {
      return Promise.resolve()
    }
    const result = this.results.pop()
    return result.metadata()
      .catch(() => {
        this.retry(result.name)
        this.results.unshift(result)
      })
      .then(() => this.cb(result))
      .then(() => this.loadNext())
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
      .catch((reason) => {
        console.log(reason)
        this.retry(file.name)
        this.files.unshift(file)
      })
      .then((streamObj) => this.dcb(streamObj.stream, streamObj.size, streamObj.md5))
      .then(() => this.downloadNext(from))
  }

  async download(resumeMap = { undefined: 0 }) {
    this.cb = (metadata) => {
      this.files.push(
        ...metadata.files,
      )
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
