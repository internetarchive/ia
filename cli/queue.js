/* eslint-disable no-console */
import { readLines } from 'https://deno.land/std/io/mod.ts'
import { Command } from 'https://deno.land/x/cliffy@v0.25.7/command/mod.ts'
import { DownloadQueue, MetaQueue } from '../lib/queue.js'
import Result from '../lib/result.js'

function queueCommands() {
  return new Command()
    .globalOption('-p, --parallel', 'Number of fetch requests to run in parallel.')
    .globalOption('-r, --retry', 'Maximum times for each item to be retried.')
    .command('metadata', 'Fetch and display in-depth metadata of each identifier.')
    .option('--jsonl <val:boolean>', 'Print one object out per-line.', { default: false })
    .arguments('[input...]')
    .action(async ({ parallel, retry, jsonl }, ...input) => {
      if (input.length === 0) {
        for await (const line of readLines(Deno.stdin)) {
          input.push(line)
        }
      }
      const meta = []
      const results = []
      input.forEach((identifier) => results.push(new Result(identifier)))
      const metadata = new MetaQueue(
        parallel,
        retry,
        (item) => meta.push(item),
        ...results,
      )
      await metadata.update()
      // eslint-disable-next-line no-param-reassign
      meta.forEach((item) => item.files.forEach((file) => delete file.parent))
      if (jsonl) {
        meta.forEach((item) => console.log(JSON.stringify(item)))
      } else {
        console.log(JSON.stringify(meta))
      }
    })
    .command('download', 'Fetch and download files from each identifier.')
    .option('--resume <val:boolean>', 'Enable resuming files.')
    .arguments('<directory:string> [input...]')
    .action(async ({ parallel, retry }, directory, ...input) => {
      if (input.length === 0) {
        for await (const line of readLines(Deno.stdin)) {
          input.push(line)
        }
      }
      const resume = {}
      const populateResume = async (dir) => {
        for await (const item of Deno.readDir(dir)) {
          const sub = `${dir}/${item.name}`
          if (!item.isDirectory) {
            resume[item.name] = (await Deno.lstat(sub)).size
          } else {
            populateResume(sub)
          }
        }
      }
      await populateResume(directory)
      const cb = async (file, stream, md5) => {
        const create = (resume[file.name] === undefined)
        const open = await Deno.open(
          `${directory}/${file.parent.identifier}/${file.name}`, {
            create,
            write: create,
            append: !create,
          },
        )
        await stream.pipeTo(open.writable)
        open.close()
        console.log(file.name, await md5)
      }
      const metadata = new DownloadQueue(
        parallel,
        retry,
        cb,
        ...input,
      )
      await metadata.download(resume)
    })
}

export default queueCommands
