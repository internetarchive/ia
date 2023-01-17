/* eslint-disable max-classes-per-file */
import * as Errors from './errors.js'

class Query {
  constructor(queries) {
    queries.forEach((query) => {
      if (typeof query.encode !== 'function') {
        throw new Errors.QueryTypeError('bad type inserted into Query type', query)
      }
    })
    this.queries = queries
  }
}

class QueryConjunction extends Query {
  constructor(...queries) {
    super(queries)
  }

  encode() {
    const parameters = []
    this.queries.forEach((query) => {
      try {
        parameters.push(query.encode())
      } catch (e) {
        throw new Errors.QueryEncodeError('an error occured encoding conjuction', query, e)
      }
    })
    return `(${parameters.join(this.deliniator)})`
  }
}

class QueryAnd extends QueryConjunction {
  constructor(...queries) {
    super(...queries)
    this.deliniator = ' AND '
  }
}

class QueryOr extends QueryConjunction {
  constructor(...queries) {
    super(...queries)
    this.deliniator = ' OR '
  }
}

class QueryNot extends Query {
  constructor(query) {
    super([query])
  }

  encode() {
    let query
    try {
      query = this.queries[0].encode()
    } catch (e) {
      throw new Errors.QueryEncodeError('an error occured in not', this.queries[0], e)
    }
    return `(NOT ${query})`
  }
}

class QueryRaw {
  constructor(string = '') {
    this.string = string
  }

  encode() {
    return `(${this.string})`
  }
}

class QueryString {
  constructor(type = 'any', string = '', contains = true, fuzzy = false) {
    const types = ['any', 'title', 'creator', 'description', 'collection', 'field1', 'field2', 'field3']
    if (!types.includes(type)) {
      throw new TypeError(`String Type: ${type} is not supported.`)
    }
    this.prefix = ((type !== types[0]) ? `${type}:` : '')
    this.string = ((fuzzy) ? `${string}~` : string)
    this.contains = contains
  }

  encode() {
    return `${((this.contains) ? '' : '-') + this.prefix}(${this.string})`
  }
}

class QueryMediaType {
  constructor(mediaType = '', is = true) {
    const types = ['', 'account', 'audio', 'data', 'image', 'movies', 'texts', 'web', 'etree']
    if (!types.includes(mediaType)) {
      throw new TypeError(`MediaType: ${mediaType} is not supported.`)
    }
    this.type = mediaType
    this.is = is
  }

  encode() {
    return `${(this.is) ? '' : '-'}mediaType:(${this.type})`
  }
}

class QueryDate {
  constructor(date = '', to = '') {
    try {
      this.date = new Date(date).toISOString()
    } catch (error) {
      throw new TypeError(`Date: from ${date} is incorrectly formatted: ${error}`)
    }
    if (to !== '') {
      try {
        this.to = new Date(to).toISOString()
      } catch (error) {
        throw new TypeError(`Date: to ${to} is incorrectly formatted: ${error}`)
      }
    }
  }

  encode() {
    if (this.to !== undefined) {
      return `date:[${this.date} TO ${this.to}]`
    }
    return `date:${this.date}`
  }
}

class QueryRange {
  constructor(type = '', from = undefined, to = undefined, include = true) {
    const types = ['downloads', 'foldoutcount', 'imagecount', 'item_size', 'month', 'week', 'year']
    if (!types.includes(type)) {
      throw new TypeError(`Range: ${type} is not supported.`)
    }
    if (!Number.isInteger(from) && from !== undefined) {
      throw new TypeError('Range: from must be an integer or undefined.')
    }
    if (!Number.isInteger(to) && to !== undefined) {
      throw new TypeError('Range: to must be an integer or undefined.')
    }
    this.type = type
    this.from = (from === undefined ? 'null' : from)
    this.to = (to === undefined ? 'null' : to)
    this.include = include
  }

  encode() {
    return `${(this.include) ? '' : '-'}${this.type}:[${this.from} TO ${this.to}]`
  }
}

export {
  QueryAnd, QueryOr, QueryRaw, QueryNot, QueryString, QueryMediaType, QueryDate, QueryRange,
}
