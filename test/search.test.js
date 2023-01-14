/* eslint-disable import/no-unresolved */
import { beforeEach, describe, it } from 'https://deno.land/std/testing/bdd.ts'
import { assertEquals, assertInstanceOf, assertThrows } from 'https://deno.land/std@0.171.0/testing/asserts.ts'
import * as Errors from '../lib/errors.js'
import * as Query from '../lib/query.js'
import Search from '../lib/search.js'
import Fields from '../lib/fields.js'
import Result from '../lib/result.js'

describe('Search', () => {
  // eslint-disable-next-line no-unused-vars
  let query
  beforeEach(() => {
    const any = new Query.QueryString('any', 'dragon')
    const media = new Query.QueryMediaType('etree')
    query = new Query.QueryAnd(any, media)
  })

  it('Any Dragon', async () => {
    const client = new Search(query, Fields, 1, 10000, 3)

    const results = []
    for await (const result of client) {
      results.push(...result)
    }
  })
  it('Callback', async () => {
    const client = new Search(query, Fields, 1, 10000, 3)

    await client.renderCallback((results) => {
      results.forEach((result) => assertInstanceOf(result, Result))
    })
  })
  it('Negative', () => {
    assertThrows(() => new Search(query, Fields, -1, -1, -1, -1))
  })
  it('No Fields', () => {
    assertThrows(() => new Search(query, undefined, -1, -1, -1, -1))
  })
  it('No Query', () => {
    assertThrows(() => new Search(undefined, Fields, -1, -1, -1, -1))
  })
  it('Over Max', () => {
    assertThrows(() => new Search(query, Fields, 1, 100, 10001, 5))
  })
  it('Upstream Error', () => {
    const client = new Search(new Query.QueryRaw('-(-'), Fields, 1, 100, 10000, 5)

    const results = []
    assertThrows(Errors.ElasticSearchError, async () => {
      for await (const result of client) {
        results.push(...result)
      }
    })

    assertEquals(results.length, 0)
  })
  it('Bad URL', async () => {
    const client = new Search(query, Fields, 1, 100, 10000, 2)
    client.searchURL = 'https://archive.org/advancedsearch.phps'

    let f
    const results = []
    try {
      for await (const result of client) {
        results.push(...result)
      }
    } catch (e) {
      f = () => { throw e }
    } finally {
      assertThrows(f)
    }

    assertEquals(results.length, 0)
  })
})
