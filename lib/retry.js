import * as Errors from './errors.js'

function Retry(retry = 0, max = 5, cb = (value) => Promise.resolve(value), ignore = [], ...args) {
  const delay = (count) => new Promise(
    (resolve) => {
      setTimeout(resolve, 10 ** count)
    },
  )
  return cb(...args).catch(
    (reason) => {
      if (ignore.indexOf(reason) > -1) {
        return Promise.reject(reason)
      }
      return delay(retry).then(
        () => {
          if (retry > max) {
            throw new Errors.MaxRetryError(reason, max)
          }
          return retry(retry + 1, max, cb, ignore, ...args)
        },
      )
    },
  )
}

export default Retry
