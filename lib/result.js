class Result {
  constructor(input) {
    if (typeof input === 'object' && input.identifier !== undefined) {
      Object.assign(this, input)
    } else if (input !== '') {
      this.identifier = input
    } else {
      throw new TypeError('Result can only be used with ')
    }
    this.metadataURL = 'https://archive.org/metadata'
    this.files = []
    this.downloadURL = ''
  }

  async metadata() {
    const response = await fetch(`${this.metadataURL}/${this.identifier}`)

    if (!response.ok) {
      throw new Error(`an error occured fetching metadata: ${response}`)
    }

    const data = await response.json()

    if (Object.keys(data).length === 0) {
      throw new Error(`no metadata exists for ${this.identifier}`)
    }

    if (data.files.length !== data.files_count) {
      throw new Error('file count does not match')
    }

    // TODO: does data.metadata have a correlation to search?
    this.files = data.files
    this.downloadURL = `https://${data.server}${data.dir}`
  }

  * download(start = 0, end = Infinity) {
    const len = Math.min(Object.keys(this.files).length, end)
    let count = 0

    if (len === 0 || start > len) {
      throw new Error(`out of bounds download start: ${start} end: ${end}`)
    }
    if (this.downloadURL === '') {
      throw new Error('must run metadata before downloading')
    }

    for (let i = start; i < len; i += 1) {
      count += 1
      const resp = fetch(`${this.downloadURL}/${this.files[i].name}`).then((response) => {
        if (!response.ok) {
          throw new Error(`error occured while downloading file ${response}`)
        }
        return response.blob()
      })
      yield resp
    }
    return count
  }
}

export default Result
