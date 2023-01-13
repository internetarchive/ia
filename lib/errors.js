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
  constructor(message, from) {
    super(message)
    this.from = from
  }
}

export {
  OutOfBoundsError, ElasticSearchError, NullMetadataError, ResumeError,
}
