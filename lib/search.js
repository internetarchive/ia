/* eslint-disable max-classes-per-file */
class Search {
  constructor(query, fields, page = 1, rows = 1, end = 10000, retry = 5) {
    this.end = 10000
    this.searchURL = 'https://archive.org/advancedsearch.php'
    if (end > this.end) {
      throw new Error(`Search: cannot query for results over ${this.end}`)
    }
    if (page < 1 || rows < 1 || end < 1 || retry < 1) {
      throw new Error('Search: cannot use negative integers for interval variables')
    }
    this.page = page
    this.rows = rows
    this.end = end
    try {
      this.params = new URLSearchParams()
      this.params.append('q', query.encode())
      for (const [k, v] of Object.entries(fields)) {
        if (v) {
          this.params.append('fl[]', k)
        }
      }
      this.params.append('output', 'json')
    } catch (error) {
      throw new Error(`Search: an error occured rendering query: ${error}`)
    }
    this.retry = retry
  }

  async search(page = 1, rows = 0) {
    const params = new URLSearchParams(this.params)
    params.set('rows', rows)
    params.set('page', page)

    const response = await fetch(`${this.searchURL}?${params.toString()}`)

    let docs = []

    if (response.status === 507) {
      return docs
    } if (!response.ok) {
      throw new Error(`response was not ok: ${response.status}`)
    }

    try {
      const data = await response.json()

      const { status } = data.responseHeader
      if (status !== 0) {
        throw new Error(`IA search responded with bad status: ${data.responseHeader}`)
      }

      this.end = Math.min(data.response.numFound, this.end)

      if (!Array.isArray(docs)) {
        throw new TypeError('results are not in list format')
      }
      docs = data.response.docs
    } catch (error) {
      throw new Error(`Search: ${error}`)
    }

    return docs
  }

  searchRetry(page = 1, rows = 0, retry = 0) {
    const delay = (count) => new Promise(
      (resolve) => {
        setTimeout(resolve, 10 ** count)
      },
    )
    return this.search(page, rows).catch(
      (reason) => delay(retry).then(
        () => {
          if (retry > this.retry) {
            return Promise.reject(reason)
          }
          return this.searchRetry(page, rows, retry + 1)
        },
      ),
    )
  }

  // eslint-disable-next-line compat/compat
  [Symbol.asyncIterator]() {
    let { page } = this
    return {
      next: async () => {
        const remainRows = this.end - (page - 1) * this.rows
        if (page * this.rows <= this.end || remainRows > 0) {
          const result = await this.searchRetry(
            page,
            Math.min(remainRows, this.rows),
          )
          page += 1
          return {
            value: result,
            done: false,
          }
        }
        return { value: undefined, done: true }
      },
      return: () => ({ value: undefined, done: true }),
    }
  }

  async renderCallback(func = (result = []) => result) {
    for await (const result of this) {
      func(result)
    }
  }
}

export default Search
