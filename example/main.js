/* eslint-disable no-console */
import Search from '../lib/search.js'
import Fields from '../lib/fields.js'
import File from '../lib/file.js'
import * as Query from '../lib/query.js'
import * as Queue from '../lib/queue.js'
import Result from '../lib/result.js'

let testresults = []
testresults = []
testresults.push(
  new Result('twitter-894946694244204545'),
)

const testqueue = new Queue.DownloadQueue(10, 5, async (file, stream, md5) => {
  console.log(file)
  console.log(file instanceof File)
  console.log(stream, ReadableStream)
  console.log(await md5)
}, ...testresults)
await testqueue.download({
  '894946694244204545.jpg': 5,
})
console.log(testqueue.downloadErrors())

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
  if (file.format === 'Ogg Video') {
    return true
  }
  return false
})
console.log('done')
console.log(bigQueue.downloadErrors())
