/* eslint-disable max-classes-per-file */
class QueryConjunction {
  constructor(...queries) {
    this.parameters = []
    try {
      queries.forEach((v) => this.parameters.push(v.encode()))
    } catch (error) {
      throw new Error(`QueryConjunction: building paramters failed: ${error}`)
    }
  }

  encode() {
    return `(${this.parameters.join(this.deliniator)})`
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

class QueryNot {
  constructor(query) {
    this.query = query.encode()
  }

  encode() {
    return `(NOT ${this.query})`
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
    if (to !== undefined) {
      try {
        this.to = new Date(date).toISOString()
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
  constructor(type = '', from = 0, to = 0, include = true) {
    const types = ['downloads', 'foldoutcount', 'imagecount', 'item_size', 'month', 'week', 'year']
    if (!types.includes(type)) {
      throw new TypeError(`Range: ${type} is not supported.`)
    }
    if (!Number.isInteger(from) && from !== undefined) {
      throw new Error('Range: from must be an integer or undefined.')
    }
    if (!Number.isInteger(to) && to !== undefined) {
      throw new Error('Range: to must be an integer or undefined.')
    }
    if (from === undefined) { this.from = 'null' }
    if (to === undefined) { this.to = 'null' }
    this.include = include
  }

  encode() {
    return `${(this.include) ? '' : '-'}${this.type}:[${this.from} TO ${this.to}]`
  }
}

export {
  QueryAnd, QueryOr, QueryRaw, QueryNot, QueryString, QueryMediaType, QueryDate, QueryRange,
}
