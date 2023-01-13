/* eslint-disable import/no-unresolved */
import { beforeEach, describe, it } from 'https://deno.land/std/testing/bdd.ts'
import {
  assert, assertEquals, assertInstanceOf, assertThrows,
} from 'https://deno.land/std@0.171.0/testing/asserts.ts'
import * as Queue from '../lib/queue.js'
import Result from '../lib/result.js'

describe('Queue', () => {
  let results = []
  beforeEach(() => {
    results = []
    results.push(
      new Result('camels'),
      new Result('night_of_the_living_dead'),
    )
  })

  describe('Metadata', () => {
    it('Simple', async () => {
      const queue = new Queue.MetaQueue(10, 5, (metadata) => {
        assertInstanceOf(metadata, Result)
      }, results)
      await queue.update()
      assertEquals(Object.keys(queue.metaErrors()).length, 0)
    })
    it('Bad Numbers', () => {
      assertThrows(() => new Queue.MetaQueue(-1, -1))
    })
    it('Bad Callback', () => {
      assertThrows(() => new Queue.MetaQueue(1, 1, 'string'))
    })
    it('Bad Results', () => {
      assertThrows(() => new Queue.MetaQueue(1, 1, () => {}, 'strung'))
    })
    it('Bad Object in Results', async () => {
      results.push('what am I doing here')
      const queue = new Queue.MetaQueue(10, 5, (metadata) => {
        assertInstanceOf(metadata, Result)
      }, results)
      await queue.update()
      assert(Object.keys(queue.metaErrors()).length > 0)
    })
    it('Retry', async () => {
      const bad = [
        new Result('nineteenhundredfiftyeightthoursand'),
      ]
      const queue = new Queue.MetaQueue(10, 5, () => {}, bad)
      await queue.update()
      assert(Object.keys(queue.metaErrors()).length > 0)
    })
  })

  describe('Download', () => {
    it('Simple', async () => {
      const queue = new Queue.DownloadQueue(10, 5, (file, stream, md5) => {
        assertInstanceOf(file, File)
        assertInstanceOf(stream, ReadableStream)
        assertInstanceOf(md5, Promise)
      }, results)
      await queue.download()
      assertEquals(Object.keys(queue.downloadErrors()).length, 0)
    })
    it('Bad Numbers', () => {
      assertThrows(() => new Queue.DownloadQueue(-1, -1))
    })
    it('Bad Callback', () => {
      assertThrows(() => new Queue.DownloadQueue(1, 1, 'string'))
    })
    it('Small Verification', async () => {
      const queue = new Queue.DownloadQueue(10, 5, async (file, stream, md5) => {
        assertInstanceOf(file, File)
        const reader = stream.getReader()
        for await (const result of reader.read()) {
          // eslint-disable-next-line no-console
          console.log(result.value.byteLength)
        }
        assertInstanceOf(md5, Promise)
        assertEquals(await md5, true)
      }, results)
      await queue.download()
      assertEquals(Object.keys(queue.downloadErrors()).length, 0)
    })
    it('Large Verification', async () => {
      const large = [
        new Result('night_of_the_living_dead'),
      ]
      const queue = new Queue.DownloadQueue(10, 5, async (file, stream, md5) => {
        assertInstanceOf(file, File)
        const reader = stream.getReader()
        for await (const result of reader.read()) {
          // eslint-disable-next-line no-console
          console.log(result.value.byteLength)
        }
        assertInstanceOf(md5, Promise)
        const final = await md5
        assertEquals(final, true)
      }, large)
      await queue.download({}, (file) => {
        if (file.format === 'Ogg Video') {
          return true
        }
        return false
      })
      assertEquals(Object.keys(queue.downloadErrors()).length, 0)
    })
  })
})
