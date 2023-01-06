/* eslint-disable no-console */
import Search from './search.js'
import Fields from './fields.js'
import * as Query from './query.js'
import * as Queue from './queue.js'

const any = new Query.QueryString('any', 'dragon')
const media = new Query.QueryMediaType('etree')
const and = new Query.QueryAnd(any, media)

console.log(and.encode())

const query = new Query.QueryRaw('cat videos')

console.log(query.encode())

const client = new Search(and, Fields, 1, 5, 5)

let results = []
for await (const result of client) {
  results.push(...result)
}
const queue = new Queue.DownloadQueue(10, 5, async (file, md5) => {
  const reader = file.getReader()
  let result;
  while (!(result = await reader.read()).done) {
    console.log('chunk size:', result.value.byteLength);
  }
  console.log(await md5)
}, ...results)
await queue.download()
console.log('done')
