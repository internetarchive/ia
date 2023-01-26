/* eslint-disable no-empty-pattern */
import { Command, EnumType } from 'https://deno.land/x/cliffy@v0.25.7/command/mod.ts'
import FieldTable from '../lib/fields.js'
import {
  QueryAnd,
  QueryDate, QueryMediaType, QueryNot, QueryOr, QueryRange, QueryRaw, QueryString,
} from '../lib/query.js'
import { DownloadQueue, MetaQueue } from '../lib/queue.js'
import Search from '../lib/search.js'

const logLevelType = new EnumType(['debug', 'info', 'warn', 'error'])

async function ia() {
  const main = new Command()
    .name('ia')
    .version('0.1.0')
    .description('Command line interface for interacting with IA APIs.')
    .type('log-level', logLevelType)
    .env('DEBUG=<enable:boolean>', 'Enable debug output.')
    .globalOption('-d, --debug', 'Enable debug output.')
    .globalOption('-l, --log-level <level:log-level>', 'Set log level.', {
      default: 'info',
    })

  // QUERY
  const query = main.command('query', 'Query builder interface.')
  query.command('string', 'String type for query.')
    .option('-t, --type: <val:string>', 'Type of string to search for.', { default: 'any' })
    .option('-c, --contains <val:boolean>', 'Query results should contain this string.', { default: true })
    .option('-f, --fuzzy <val:boolean>', 'Use fuzzy search for this string.', { default: false })
    .arguments('<string:string> <output:string>')
    .action(({ type, contains, fuzzy }, string) => new QueryString(
      type,
      string,
      contains,
      fuzzy,
    ).encode())
  query.command('mediatype', 'Media type for query.')
    .option('-i, --is <val:boolean>', 'Query results should contain this media type.', { default: true })
    .arguments('<mediaType:string> <output:string>')
    .action(({ is }, mediaType) => new QueryMediaType(
      mediaType,
      is,
    ).encode())
  query.command('raw', 'Raw type for query.')
    .arguments('<string:string> <output:string>')
    .action(({}, string) => new QueryRaw(
      string,
    ).encode())
  query.command('date', 'Date type for query.')
    .option('-t, --to <val:string>', 'Include dates up to.')
    .arguments('<date:string> <output:string>')
    .action(({ to }, date) => new QueryDate(
      date,
      to,
    ).encode())
  query.command('range', 'Range type for query.')
    .option('-t, --type: <val:string>', 'Type of range to search for.', { default: 'downloads' })
    .option('-i, --include <val:boolean>', 'Query results should contain this range.', { default: true })
    .arguments('<from:string> <to:string> <output:string>')
    .action(({ type, include }, from, to) => new QueryRange(
      type,
      from,
      to,
      include,
    ).encode())
  const queryOperator = query.command('operator', 'Operator collection for logical components.')
  queryOperator.command('and', 'And logical operator.')
    .arguments('[queries:string] <output:string>')
    .action(({}, ...queries) => {
      const collection = []
      queries.forEach((item) => collection.push(new QueryRaw(item)))
      return new QueryAnd(...collection).encode()
    })
  queryOperator.command('or', 'Or logical operator.')
    .arguments('[queries:string] <output:string>')
    .action(({}, ...queries) => {
      const collection = []
      queries.forEach((item) => collection.push(new QueryRaw(item)))
      return new QueryOr(...collection).encode()
    })
  queryOperator.command('not', 'Not logical operator.')
    .arguments('<input:string> <output:string>')
    .action(({}, input) => new QueryNot(
      new QueryRaw(input),
    ).encode())

  // SEARCH
  main.command('search', 'Search internet archive.')
    .option('-p, --page <val:number>', 'Start at this page.', { default: 1 })
    .option('-r, --rows <val:number>', 'Number of rows to return.', { default: 500 })
    .option('-e, --end <val:number>', 'Number of records in total to return.', { default: 10000 })
    .option('-r, --retry <val:number>', 'Number of retry attempts per paginated requrest.', { default: 5 })
    .option('-i, --identifiers <val:boolean>', 'Only return identifiers, useful to input directly into queue.', { default: false })
    .arguments('<input:string> <output:string>')
    .action(async ({
      page, rows, end, retry, identifiers,
    }, input) => {
      const client = new Search(
        input,
        FieldTable,
        page,
        rows,
        end,
        retry,
      )
      const results = []
      for await (const result of client) {
        if (!identifiers) {
          results.push(...result)
        } else {
          result.forEach((item) => results.push(item.identifier))
        }
      }
      return JSON.stringify(results)
    })

  // QUEUE
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
        const open = await Deno.open(
          `${directory}/${file.parent.identifier}/${file.name}`, {
            create: (resume[file.name] === undefined),
            write: (resume[file.name] === undefined),
            append: (resume[file.name] !== undefined),
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
  await main.parse(Deno.args)
}

if (import.meta.main) {
  ia().finally()
}
