// eslint-disable-next-line max-classes-per-file
class MetaQueue {
  constructor(parallel = 10, cb = (metadata) => metadata, ...results) {
    this.results = results
    this.parallel = parallel
    this.cb = cb
    this.position = 0
  }

  loadNext() {
    if (this.position >= this.results.length) {
      return Promise.resolve()
    }
    const result = this.results[this.position]
    this.position += 1
    return result.metadata()
      .then(() => this.cb(result))
      .then(this.loadNext())
  }

  async update() {
    const queue = []
    for (let x = 0; x < this.parallel; x++) {
      queue.push(this.loadNext())
    }
    return await Promise.allSettled(queue)
  }
}

class DownloadQueue extends MetaQueue {
  constructor(parallel = 10, cb = (file, sha) => [file, sha], ...results) {
    super(parallel, undefined, ...results)
    this.dcb = cb
    this.metadata = []
  }

  downloadNext() {
    if (this.files.length === 0) {
      return
    }
    const file = this.files.pop()

  }

  async download() {
    this.cb = (metadata) => {
      this.files.push(
        ...metadata.files,
      )
    }
    await this.update()
    const queue = []
    for (let x = 0; x < this.parallel; x++) {
      queue.push()
    }
  }
}

export { MetaQueue, DownloadQueue }
