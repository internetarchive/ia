// eslint-disable-next-line max-classes-per-file
class MetaQueue {
  constructor(parallel = 10, cb = (metadata) => metadata, ...results) {
    this.results = results
    this.parallel = parallel
    this.cb = cb
  }

  loadNext() {
    if (this.results.length === 0) {
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
  constructor(parallel = 10, ...results) {
    super(parallel, undefined, results)
    this.files = []
  }

  async download() {
    this.cb = (metadata) => {
      this.files.push(
        ...metadata.files,
      )
    }
    await this.update()
  }
}

export { MetaQueue, DownloadQueue }
