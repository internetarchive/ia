/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
import { beforeEach, describe, it } from 'https://deno.land/std/testing/bdd.ts'
import {
  assert, assertEquals, assertExists, assertInstanceOf, assertThrows,
} from 'https://deno.land/std@0.171.0/testing/asserts.ts'
import * as Errors from '../lib/errors.js'
import File from '../lib/file.js'
import Result from '../lib/result.js'

describe('Result', () => {
  describe('Identifier', () => {
    let result
    beforeEach(() => {
      result = new Result('night_of_the_living_dead')
    })

    it('MetadataURL', () => {
      assertEquals(result.metadataURL, 'https://archive.org/metadata/night_of_the_living_dead')
    })
    it('DetailsURL', () => {
      assertEquals(result.detailsURL, 'https://archive.org/details/night_of_the_living_dead')
    })
    it('DownloadURL', () => {
      assertEquals(result.downloadURL, undefined)
    })

    describe('Metadata/Download', () => {
      beforeEach(async () => {
        await result.metadata()
      })

      it('DownloadURL', () => {
        assertExists(result.downloadURL)
      })
      it('Files', () => {
        result.files.forEach((file) => {
          assertInstanceOf(file, File)
        })
      })
      it('Parenthood', () => {
        result.files.forEach((file) => {
          assertEquals(file.parent, result)
        })
      })
      it('Download', async () => {
        for (let x = 0; x < result.files.length; x++) {
          const file = result.files[x]
          if (file.format === 'MPEG2') {
            const { stream, md5 } = await file.download()
            const reader = stream.getReader()
            let chunk
            // eslint-disable-next-line no-cond-assign
            while (!(chunk = await reader.read()).done) {
              console.log('chunk size:', chunk.value.byteLength)
            }
            const final = await md5
            console.log('md5: ', final)
            assert(typeof final === 'boolean')
          }
        }
      })
    })
  })

  describe('Bad Identifier', () => {
    let result
    beforeEach(() => {
      result = new Result('nineteenhundredfiftyeightthoursand')
    })

    it('Metadata', async () => {
      let f
      try {
        await result.metadata()
      } catch (e) {
        f = () => { throw e }
      } finally {
        assertThrows(f, Errors.NullMetadataError)
      }
    })
  })

  describe('Upstream Error', () => {
    let result
    beforeEach(() => {
      result = new Result('night_of_the_living_dead')
      result.metadataURL.substring(0, result.metadataURL.length - 5)
    })

    it('Metadata', async () => {
      let f
      try {
        await result.metadata()
      } catch (e) {
        f = () => { throw e }
      } finally {
        assertThrows(f)
      }
    })
  })

  it('Type', () => {
    assertThrows(() => new Result(undefined))
  })
})
