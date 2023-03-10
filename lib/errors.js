/* eslint-disable max-classes-per-file */
class OutOfBoundsError extends Error {
  constructor(message) {
    super(message)
    this.name = 'OutOfBoundsError'
    this.status = 507
  }
}

class ElasticSearchError extends Error {
  constructor(message) {
    if (!Array.isArray(message.forensics.decoded_reply.message) ||
        message.forensics.status_code === undefined) {
      throw new TypeError('bad message passed to ElasticSearchError')
    }
    super(message.forensics.decoded_reply.message.join(', '))
    this.name = 'ElasticSearchError'
    this.status = message.forensics.status_code
  }
}

class NullMetadataError extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'NullMetadataError'
  }
}

class ResumeError extends Error {
  constructor(message, from, size, file) {
    super(message)
    this.name = 'ResumeError'
    this.from = from
    this.size = Number(size)
    this.file = file
  }
}

class QueryEncodeError extends Error {
  constructor(message, query, suberror) {
    super(message)
    this.name = 'QueryEncodeError'
    this.query = query
    this.suberror = suberror
  }
}

class QueryTypeError extends Error {
  constructor(message, query) {
    super(message)
    this.name = 'QueryTypeError'
    this.query = query
  }
}

class ResultField extends Error {
  constructor(message, field) {
    super(message)
    this.field = field
  }
}

class FileField extends Error {
  constructor(message, field) {
    super(message)
    this.field = field
  }
}

export {
  OutOfBoundsError,
  ElasticSearchError,
  NullMetadataError,
  ResumeError,
  QueryEncodeError,
  QueryTypeError,
  ResultField,
  FileField,
}
