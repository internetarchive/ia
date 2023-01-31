/* eslint-disable no-console */
import { Command } from 'https://deno.land/x/cliffy@v0.25.7/command/mod.ts'
import { DownloadQueue, MetaQueue } from '../lib/queue.js'

function stringOrList(input) {
  if (input[0] === '[' && input[input.length - 1] === ']') {
    const identifiers = JSON.parse(input)
    if (!Array.isArray(identifiers)) {
      throw new TypeError('input is not a valid json type list')
    }
    identifiers.forEach((element) => {
      if (typeof element !== 'string') {
        throw new TypeError('input contains non-string element in json type list')
      }
    })
    return identifiers
  }
  return [input]
}

function queueCommands() {
  return new Command()
    .globalOption('-p, --parallel', 'Number of fetch requests to run in parallel.')
    .globalOption('-r, --retry', 'Maximum times for each item to be retried.')
    .command('metadata', 'Fetch and display in-depth metadata of each identifier.')
    .arguments('<input:string>')
    .action(async ({ parallel, retry }, input) => {
      const results = []
      const metadata = new MetaQueue(
        parallel,
        retry,
        (item) => results.push(item),
        ...stringOrList(input),
      )
      await metadata.update()
      console.log(JSON.stringify(results))
    })
    .command('download', 'Fetch and download files from each identifier.')
    .option('--resume <val:boolean>', 'Enable resuming files.')
    .arguments('<directory:string> <input:string>')
    .action(async ({ parallel, retry }, directory, ...input) => {
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
        ...stringOrList(input),
      )
      await metadata.download(resume)
    })
}

export default queueCommands
