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
    this.name = 'MetadataError'
  }
}

class BlobSHAMismatchError extends Error {
  constructor(message, desired, current) {
    super(message)
    this.name = 'MetadataError'
    this.desired = desired
    this.current = current
  }
}

class MaxRetryError extends Error {
  constructor(message, retries) {
    super(message)
    this.retries = retries
  }
}

export {
  OutOfBoundsError, ElasticSearchError, NullMetadataError, BlobSHAMismatchError, MaxRetryError,
}
