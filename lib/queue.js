// eslint-disable-next-line max-classes-per-file
class MetaQueue {
  constructor(parallel = 10, cb = (metadata) => metadata, ...results) {
    this.results = results
    this.parallel = parallel
    this.cb = cb
  }

  loadNext() {
    if (this.position >= this.results.length) {
      return Promise.resolve()
    }
    const result = this.results.pop()
    return result.metadata()
      .then(() => this.cb(result))
      .then(this.loadNext())
  }

  update() {
    const queue = []
    for (let x = 0; x < this.parallel; x++) {
      queue.push(this.loadNext())
    }
    return Promise.allSettled(queue)
  }
}

class DownloadQueue extends MetaQueue {
  constructor(parallel = 10, cb = (file, sha1) => [file, sha1], ...results) {
    super(parallel, undefined, ...results)
    this.dcb = cb
    this.files = []
  }

  downloadNext(resumeMap) {
    if (this.files.length === 0) {
      return Promise.resolve()
    }
    const file = this.files.pop()
    let from = 0
    if (resumeMap[file.name] !== undefined) {
      from = resumeMap[file.name]
    }
    return file.download()
      .then((streamObj) => this.dcb(streamObj.stream, streamObj.sha1))
      .then(this.downloadNext(from))
  }

  async download(resumeMap = { undefined: 0 }) {
    this.cb = (metadata) => {
      this.files.push(
        ...metadata.files,
      )
    }
    await this.update()
    this.position = 0
    const queue = []
    for (let x = 0; x < this.parallel; x++) {
      queue.push(this.downloadNext(resumeMap))
    }
    return Promise.allSettled(queue)
  }
}

export { MetaQueue, DownloadQueue }
