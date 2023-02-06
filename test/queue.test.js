/* eslint-disable no-cond-assign */
/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
import { beforeEach, describe, it } from 'https://deno.land/std/testing/bdd.ts'
import {
  assert, assertEquals, assertInstanceOf, assertThrows,
} from 'https://deno.land/std@0.171.0/testing/asserts.ts'
import * as Queue from '../lib/queue.js'
import * as Errors from '../lib/errors.js'
import File from '../lib/file.js'
import Result from '../lib/result.js'

describe('Queue', () => {
  let results
  beforeEach(() => {
    results = [
      new Result('twitter-894946694244204545'),
    ]
  })

  describe('Metadata', () => {
    it('Simple', async () => {
      const queue = new Queue.MetaQueue(10, 5, (metadata) => {
        assertInstanceOf(metadata, Result)
      }, ...results)
      await queue.update()
      assertEquals(queue.metaErrorMap.size, 0)
    })
    it('Bad Numbers', () => {
      assertThrows(() => new Queue.MetaQueue(-1, -1))
    })
    it('Bad Callback', () => {
      assertThrows(() => new Queue.MetaQueue(1, 1, 'string'))
    })
    it('Bad Results', () => {
      assertThrows(() => new Queue.MetaQueue(1, 1, () => {}, ...[]))
    })
    it('Bad Object in Results', async () => {
      results.push('what am I doing here')
      const queue = new Queue.MetaQueue(10, 5, (metadata) => {
        assertInstanceOf(metadata, Result)
      }, ...results)
      await queue.update()
      assert(queue.metaErrorMap.size > 0)
    })
    it('Retry', async () => {
      const queue = new Queue.MetaQueue(10, 2, () => {}, new Result('nineteenhundredfiftyeightthoursand'))
      await queue.update()
      assert(queue.metaErrorMap.size > 0)
    })
  })

  describe('Download', () => {
    it('Simple', async () => {
      const queue = new Queue.DownloadQueue(10, 5, (file, stream) => {
        console.log(file.name)
        stream.cancel()
      }, ...results)
      await queue.download()
      assertEquals(queue.downloadErrorMap.size, 0)
    })
    it('Resume', async () => {
      const queue = new Queue.DownloadQueue(10, 5, (file, stream) => {
        console.log(file.name)
        stream.cancel()
      }, ...results)
      await queue.download({
        '894946694244204545.jpg': 5,
      })
      assertEquals(queue.downloadErrorMap.size, 0)
    })
    it('Less than 0 Resume', async () => {
      const queue = new Queue.DownloadQueue(10, 7, (file, stream) => {
        console.log(file.name)
        stream.cancel()
      }, ...results)
      await queue.download({
        '894946694244204545.jpg': -5,
      })
      assertThrows(() => { throw queue.downloadErrorMap.get('894946694244204545.jpg') }, Errors.ResumeError)
    })
    it('Bad Resume', async () => {
      const queue = new Queue.DownloadQueue(10, 7, (file, stream) => {
        console.log(file.name)
        stream.cancel()
      }, ...results)
      await queue.download({
        '894946694244204545.jpg': 500000000000,
      })
      assertThrows(() => { throw queue.downloadErrorMap.get('894946694244204545.jpg') }, Errors.ResumeError)
    })
    it('Bad Numbers', () => {
      assertThrows(() => new Queue.DownloadQueue(-1, -1))
    })
    it('Bad Callback', () => {
      assertThrows(() => new Queue.DownloadQueue(1, 1, 'not a func', ...[]))
    })
    it('Small Verification', async () => {
      const queue = new Queue.DownloadQueue(10, 5, async (file, stream, md5) => {
        assertInstanceOf(file, File)
        const reader = stream.getReader()
        let result
        let size = 0
        while (!(result = await reader.read()).done) {
          console.log('chunk size:', result.value.byteLength)
          size += result.value.byteLength
        }
        const final = await md5
        console.log('md5: ', final)
        assert(typeof final === 'boolean')
        assertEquals(size, Number(file.size))
        return final
      }, ...results)
      await queue.download()
      assertEquals(queue.downloadErrorMap.size, 0)
    })
    it('Large Verification', async () => {
      const queue = new Queue.DownloadQueue(10, 5, async (file, stream, md5) => {
        assertInstanceOf(file, File)
        const reader = stream.getReader()
        let result
        let size = 0
        while (!(result = await reader.read()).done) {
          console.log('chunk size:', result.value.byteLength)
          size += result.value.byteLength
        }
        const final = await md5
        console.log('md5: ', final)
        assert(typeof final === 'boolean')
        assertEquals(size, Number(file.size))
        return final
      }, new Result('night_of_the_living_dead'))
      await queue.download({}, (file) => {
        if (file.format === 'Ogg Video') {
          return true
        }
        return false
      })
      assertEquals(queue.downloadErrorMap.size, 0)
    })
  })
})
