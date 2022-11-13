/* eslint-disable no-console */
import Search from './search.js'
import Result from './result.js'
import Fields from './fields.js'
import * as Query from './query.js'

const any = new Query.QueryString('any', 'dragon')
const media = new Query.QueryMediaType('etree')
const and = new Query.QueryAnd(any, media)

console.log(and.encode())

const query = new Query.QueryRaw('cat videos')

console.log(query.encode())

const client = new Search(and, Fields, 1, 500, 1)

let count = 0
let page = 0
client.renderCallback((result) => {
  console.log(`Page: ${page += 1}`)
  result.forEach((value) => {
    console.log(`${value.identifier}--${count += 1}`)
    // value.renderCallback(0, Infinity, (blob) => console.log(blob))
  })
}).finally(() => console.log('Done'))

const result = new Result('nrps1974-04-13.late.aud.moore.berger.100289.flac16')
result.renderCallback(0, Infinity, (blob) => {
  console.log(blob)
})
