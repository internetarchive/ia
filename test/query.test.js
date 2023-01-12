/* eslint-disable import/no-unresolved */
import { describe, it } from 'https://deno.land/std/testing/bdd.ts'
import { assertEquals, assertThrows } from 'https://deno.land/std@0.171.0/testing/asserts.ts'
import * as Query from '../lib/query.js'

describe('Query', () => {
  it('Raw', () => {
    const query = new Query.QueryRaw('cat videos')

    assertEquals(query.encode(), '(cat videos)')
  })

  it('Conjunction', () => {
    const any = new Query.QueryString('any', 'dragon')
    const media = new Query.QueryMediaType('etree')
    const query = new Query.QueryAnd(any, media)

    assertEquals(query.encode(), '((dragon) AND mediaType:(etree))')
  })

  describe('Dates', () => {
    it('Simple', () => {
      const date = new Query.QueryDate('12/22/2023')

      assertEquals(date.encode(), 'date:2023-12-22T07:00:00.000Z')
    })
    it('Range', () => {
      const date = new Query.QueryDate('12/22/2023', '12/23/2023')

      assertEquals(date.encode(), 'date:[2023-12-22T07:00:00.000Z TO 2023-12-22T07:00:00.000Z]')
    })
    it('Bad Type', () => {
      assertThrows(() => new Query.QueryDate('bleep', 'bloop'))
    })
  })

  describe('Ranges', () => {
    it('Downloads', () => {
      const range = new Query.QueryRange('downloads', 5, 600)

      assertEquals(range.encode(), 'downloads:[5 TO 600]')
    })
    it('Null', () => {
      const query = new Query.QueryRange('item_size', 0)

      assertEquals(query.encode(), 'item_size:[0 TO null]')
    })
    it('Bad Type', () => {
      assertThrows(() => new Query.QueryRange('nowhere', 0, 5))
    })
  })
})
