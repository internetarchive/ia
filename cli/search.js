/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import { readLines } from 'https://deno.land/std/io/mod.ts'
import { Command } from 'https://deno.land/x/cliffy@v0.25.7/command/mod.ts'
import FieldTable from '../lib/fields.js'
import { QueryRaw } from '../lib/query.js'
import Search from '../lib/search.js'

function searchCommands() {
  return new Command()
    .description('Search IA for metadata and identifiers.')
    .option('-p, --page <val:number>', 'Start at this page.', { default: 1 })
    .option('-r, --rows <val:number>', 'Number of rows to return.', { default: 500 })
    .option('-e, --end <val:number>', 'Number of records in total to return.', { default: 10000 })
    .option('--retry <val:number>', 'Number of retry attempts per paginated requrest.', { default: 5 })
    .option('-i, --identifiers <val:boolean>', 'Only return identifiers, one per line, useful to input directly into queue.', { default: true })
    .option('--jsonl <val:boolean>', 'Print one object out per-line. Incompatible with --identifiers', { default: false })
    .arguments('[input:string]')
    .action(async (options, input) => {
      if (input === undefined) {
        input = ''
        for await (const line of readLines(Deno.stdin)) {
          input += line
        }
      }
      if (options.logLevel === 'info') {
        console.info(options, input)
      }

      let client
      try {
        client = new Search(
          new QueryRaw(input),
          FieldTable,
          options.page,
          options.rows,
          options.end,
          options.retry,
        )
      } catch (e) {
        if (options.logLevel === 'error') {
          console.error('Search building error:', e)
        }
        Deno.exit(1)
      }

      const lines = (options.jsonl || options.identifiers)
      try {
        if (!lines) {
          console.log('[')
        }
        for await (const result of client) {
          if (lines) {
            result.forEach(
              (item) => console.log(options.identifiers ? item.identifier : JSON.stringify(item)),
            )
          } else {
            console.log(`${JSON.stringify(result)},`)
          }
        }
        if (!lines) {
          console.log(']')
        }
      } catch (e) {
        if (options.logLevel === 'error') {
          console.error('Search error:', e)
        }
        Deno.exit(1)
      }
    })
}

export default searchCommands
