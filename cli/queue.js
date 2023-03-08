/* eslint-disable no-console */
import { readLines } from 'https://deno.land/std/io/mod.ts'
import { Command } from 'https://deno.land/x/cliffy@v0.25.7/command/mod.ts'
import { DownloadQueue, MetaQueue } from '../lib/queue.js'
import Result from '../lib/result.js'

function queueCommands() {
  return new Command()
    .description('Methods to fetch file metadata and download files.')
    .globalOption('-p, --parallel <val:number>', 'Number of fetch requests to run in parallel.')
    .globalOption('-r, --retry <val:number>', 'Maximum times for each item to be retried.')
    .command('metadata', 'Fetch and display in-depth metadata of each identifier.')
    .option('--jsonl <val:boolean>', 'Print one object out per-line.', { default: false })
    .arguments('[input...]')
    .action(async (options, ...input) => {
      if (input.length === 0) {
        for await (const line of readLines(Deno.stdin)) {
          input.push(line)
        }
      }
      if (options.logLevel === 'info') {
        console.info(options, ...input)
      }

      const meta = []
      const results = []
      try {
        input.forEach((identifier) => results.push(new Result(identifier)))
      } catch (e) {
        if (options.logLevel === 'error') {
          console.error('Result building error:', e)
        }
        return
      }

      let metadata
      try {
        metadata = new MetaQueue(
          options.parallel,
          options.retry,
          (item) => meta.push(item),
          ...results,
        )
      } catch (e) {
        if (options.logLevel === 'error') {
          console.error('Queue building error:', e)
        }
        return
      }

      await metadata.update()
      // eslint-disable-next-line no-param-reassign
      meta.forEach((item) => item.files.forEach((file) => delete file.parent))
      if (options.jsonl) {
        meta.forEach((item) => console.log(JSON.stringify(item)))
      } else {
        console.log(JSON.stringify(meta))
      }

      if (options.logLevel === 'error') {
        metadata.metaErrorMap.forEach((v, k) => {
          console.error('Update error:', k, v)
        })
      }
    })
    .command('download', 'Fetch and download files from each identifier.')
    .option('--resume <val:boolean>', 'Enable resuming files.')
    .arguments('<directory:string> [input...]')
    .action(async (options, directory, ...input) => {
      if (input.length === 0) {
        for await (const line of readLines(Deno.stdin)) {
          input.push(line)
        }
      }
      if (options.logLevel === 'info') {
        console.info(options, ...input)
      }

      const resume = {}
      const populateResume = async (dir) => {
        for await (const item of Deno.readDir(dir)) {
          const sub = `${dir}/${item.name}`
          if (!item.isDirectory) {
            resume[
              sub.slice(directory.length + 1)
            ] = (await Deno.lstat(sub)).size
          } else {
            await populateResume(sub)
          }
        }
      }
      try {
        await populateResume(directory)
      } catch (e) {
        if (options.logLevel === 'error') {
          console.error('Resume building error:', e)
        }
        Deno.exit(1)
      }

      if (options.logLevel === 'info') {
        console.info(resume)
      }

      const cb = async (file, stream, md5) => {
        const create = (resume[file.name] === undefined)
        const path = `${directory}/${file.parent.identifier}/${file.name}`
        await Deno.mkdir(path
          .split('/')
          .slice(0, -1)
          .join('/'), { recursive: true })
        const handle = await Deno.open(
          path, {
            create,
            write: create,
            append: !create,
          },
        )
        await stream.pipeTo(handle.writable)
        console.log(file.name, await md5)
      }

      const results = []
      try {
        input.forEach((identifier) => results.push(new Result(identifier)))
      } catch (e) {
        if (options.logLevel === 'error') {
          console.error('Result building error:', e)
        }
        Deno.exit(1)
      }

      let download
      try {
        download = new DownloadQueue(
          options.parallel,
          options.retry,
          cb,
          ...results,
        )
      } catch (e) {
        if (options.logLevel === 'error') {
          console.error('Queue building error:', e)
        }
        Deno.exit(1)
      }
      await download.download(resume)

      if (options.logLevel === 'error') {
        download.downloadErrorMap.forEach((v, k) => {
          console.error('Download error:', k, v)
        })
      }
    })
}

export default queueCommands
