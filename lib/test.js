/* eslint-disable no-console */
import Search from './search.js'
import Fields from './fields.js'
import * as Query from './query.js'

const any = new Query.QueryString('any', 'dragon')
const media = new Query.QueryMediaType('etree')
const and = new Query.QueryAnd(any, media)

console.log(and.encode())

const query = new Query.QueryRaw('cat videos')

console.log(query.encode())

const client = new Search(query, Fields, 1, 500, 10000)

let count = 0
let page = 0
client.renderCallback((result) => {
  console.log(`Page: ${page += 1}`)
  result.forEach(async (value) => {
    console.log(`${value.identifier}--${count += 1}`)
    await value.metadata()
    console.log(value.files)
    for (const blobProm of value.download()) {
      blobProm.then((blob) => console.log(blob))
    }
  })
}).finally(() => console.log('Done'))
