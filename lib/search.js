import * as Errors from './errors.js'
import Fields from './fields.js'
import Result from './result.js'

/* eslint-disable max-classes-per-file */
class Search {
  constructor(query = {}, fields = Fields, page = 1, rows = 500, end = 10000, retry = 5) {
    this.end = 10000
    if (end > this.end) {
      throw new Error(`Search: cannot query for results over ${this.end}`)
    }
    if (page < 1 || rows < 1 || end < 1 || retry < 1) {
      throw new Error('Search: cannot use negative integers for interval variables')
    }
    this.page = page
    this.rows = rows
    this.end = end
    if (!(fields instanceof Set)) {
      throw new TypeError('Search: fields passed into parameter must be a type of Set')
    }
    fields.add('identifier')
    if (typeof query.encode !== 'function') {
      throw new TypeError('Search: object passed into query parameter must be callable')
    }
    const encoded = query.encode()
    if (typeof encoded !== 'string') {
      throw new TypeError('Search: query.encode must return a string')
    }
    this.params = new URLSearchParams()
    this.params.append('q', encoded)
    fields.forEach((field) => this.params.append('fl[]', field))
    this.params.append('output', 'json')
    this.retry = retry
    this.searchURL = 'https://archive.org/advancedsearch.php'
  }

  async search(page = 1, rows = 0) {
    const params = new URLSearchParams(this.params)
    params.set('rows', rows)
    params.set('page', page)

    const response = await fetch(`${this.searchURL}?${params.toString()}`)

    if (response.status === 507) {
      await response.body.cancel()
      throw new Errors.OutOfBoundsError('query has run out of bounds')
    } if (!response.ok) {
      await response.body.cancel()
      throw new Error(`response was not ok: ${response.status}`)
    }

    const data = await response.json()

    if (data.forensics !== undefined) {
      throw new Errors.ElasticSearchError(data)
    }

    const { status } = data.responseHeader
    if (status !== 0) {
      throw new Error(`IA search responded with bad status: ${data.responseHeader}`)
    }

    this.end = Math.min(data.response.numFound, this.end)

    return data.response.docs
  }

  searchRetry(page = 1, rows = 0, retry = 0) {
    const delay = (count) => new Promise(
      (resolve) => {
        setTimeout(resolve, 10 ** count)
      },
    )
    return this.search(page, rows).catch(
      (reason) => {
        if (reason instanceof Errors.ElasticSearchError ||
          reason instanceof Errors.OutOfBoundsError ||
          reason instanceof TypeError) {
          return Promise.reject(reason)
        }
        return delay(retry).then(
          () => {
            if (retry > this.retry) {
              return Promise.reject(reason)
            }
            return this.searchRetry(page, rows, retry + 1)
          },
        )
      },
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
          const results = []
          result.forEach(
            (value) => results.push(
              new Result(value),
            ),
          )
          page += 1
          return {
            value: results,
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
