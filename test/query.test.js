/* eslint-disable import/no-unresolved */
import { beforeEach, describe, it } from 'https://deno.land/std/testing/bdd.ts'
import { assertEquals, assertThrows } from 'https://deno.land/std@0.171.0/testing/asserts.ts'
import * as Query from '../lib/query.js'

describe('Query', () => {
  it('Raw', () => {
    const query = new Query.QueryRaw('cat videos')

    assertEquals(query.encode(), '(cat videos)')
  })

  it('Not', () => {
    const any = new Query.QueryString('any', 'hello')
    const query = new Query.QueryNot(any)

    assertEquals(query.encode(), '(NOT (hello))')
  })

  describe('Conjunctions', () => {
    let any
    let media
    beforeEach(() => {
      any = new Query.QueryString('any', 'dragon')
      media = new Query.QueryMediaType('etree')
    })

    it('And', () => {
      const query = new Query.QueryAnd(any, media)

      assertEquals(query.encode(), '((dragon) AND mediaType:(etree))')
    })

    it('Or', () => {
      const query = new Query.QueryOr(any, media)

      assertEquals(query.encode(), '((dragon) OR mediaType:(etree))')
    })
  })

  describe('Strings', () => {
    it('Any', () => {
      const query = new Query.QueryString('any', 'cats')

      assertEquals(query.encode(), '(cats)')
    })
    it('Title', () => {
      const query = new Query.QueryString('title', 'more cats')

      assertEquals(query.encode(), 'title:(more cats)')
    })
    it('Fuzzy', () => {
      const query = new Query.QueryString('any', 'cats', true, true)

      assertEquals(query.encode(), '(cats~)')
    })
    it('Contains', () => {
      const query = new Query.QueryString('any', 'cats', false)

      assertEquals(query.encode(), '-(cats)')
    })
    it('Type', () => {
      assertThrows(() => new Query.QueryString('cats', 'kittens'))
    })
  })

  describe('MediaType', () => {
    it('All', () => {
      const query = new Query.QueryMediaType()

      assertEquals(query.encode(), 'mediaType:()')
    })
    it('Account', () => {
      const query = new Query.QueryMediaType('account')

      assertEquals(query.encode(), 'mediaType:(account)')
    })
    it('Is Not', () => {
      const query = new Query.QueryMediaType('', false)

      assertEquals(query.encode(), '-mediaType:()')
    })
    it('Type', () => {
      assertThrows(() => Query.QueryMediaType('box'))
    })
  })

  describe('Dates', () => {
    it('Simple', () => {
      const date = new Query.QueryDate('12/22/2023 00:00')

      assertEquals(date.encode(), 'date:2023-12-22T07:00:00.000Z')
    })
    it('Range', () => {
      const date = new Query.QueryDate('12/22/2023 00:00', '12/23/2023 00:00')

      assertEquals(date.encode(), 'date:[2023-12-22T07:00:00.000Z TO 2023-12-23T07:00:00.000Z]')
    })
    it('From Type', () => {
      assertThrows(() => new Query.QueryDate('bleep'))
    })
    it('To Type', () => {
      assertThrows(() => new Query.QueryDate('12/22/2023', 'bloop'))
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
    it('From Type', () => {
      assertThrows(() => new Query.QueryRange('imagecount', 'a', 5))
    })
    it('To Type', () => {
      assertThrows(() => new Query.QueryRange('imagecount', 0, 'b'))
    })
  })
})
