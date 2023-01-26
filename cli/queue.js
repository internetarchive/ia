import { DownloadQueue, MetaQueue } from '../lib/queue.js'

function queueCommands(main) {
  const queue = main.command('queue', 'Interact with identifiers.')
    .option('-p, --parallel', 'Number of fetch requests to run in parallel.')
    .option('-r, --retry', 'Maximum times for each item to be retried.')
  queue.command('metadata', 'Fetch and display in-depth metadata of each identifier.')
    .arguments('[input:string] <output:string>')
    .action(async ({ parallel, retry }, ...input) => {
      const results = []
      const metadata = new MetaQueue(
        parallel,
        retry,
        (item) => results.push(item),
        ...input,
      )
      await metadata.update()
      return JSON.stringify(results)
    })
  queue.command('download', 'Fetch and download files from each identifier.')
    .option('--resume <val:boolean>', 'Enable resume ')
    .arguments('<directory:string> [input:string]')
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
          })
        await stream.pipeTo(open.writable)
        open.close()
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
