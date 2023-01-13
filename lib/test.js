/* eslint-disable no-console */
import Search from './search.js'
import Fields from './fields.js'
import * as Query from './query.js'
import * as Queue from './queue.js'
import Result from './result.js'

const any = new Query.QueryString('any', 'dragon')
const media = new Query.QueryMediaType('etree')
const and = new Query.QueryAnd(any, media)

console.log(and.encode())

const query = new Query.QueryRaw('cat videos')

console.log(query.encode())

const client = new Search(and, Fields, 1, 1, 1)

const results = []
for await (const result of client) {
  results.push(...result)
}

const downloadCB = async (file, stream, md5) => {
  const reader = stream.getReader()
  console.log(file.name, file.size)
  let result;
  while (!(result = await reader.read()).done) {
    console.log('chunk size:', result.value.byteLength);
  }
  console.log(await md5)
}

const cors = new Result('camels')
const corsQueue = new Queue.DownloadQueue(20, 5, downloadCB, cors)
await corsQueue.download()

const queue = new Queue.DownloadQueue(10, 1, downloadCB, ...results)
await queue.download({}, (file) => {
  console.log(file)
  if (file.size > 1000000) {
    return false
  }
  return true
})
console.log('done')
console.log(queue.metaErrors())

const bigFile = new Result('night_of_the_living_dead')
const bigQueue = new Queue.DownloadQueue(5, 5, downloadCB, bigFile)
await bigQueue.download({}, (file) => {
  console.log(file)
  if (file.format === 'MPEG2') {
    return true
  }
  return false
})
console.log('done')
console.log(bigQueue.downloadErrors())
