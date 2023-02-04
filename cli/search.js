/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import { readLines } from 'https://deno.land/std/io/mod.ts'
import { Command } from 'https://deno.land/x/cliffy@v0.25.7/command/mod.ts'
import FieldTable from '../lib/fields.js'
import { QueryRaw } from '../lib/query.js'
import Search from '../lib/search.js'

function searchCommands() {
  return new Command()
    .option('-p, --page <val:number>', 'Start at this page.', { default: 1 })
    .option('-r, --rows <val:number>', 'Number of rows to return.', { default: 500 })
    .option('-e, --end <val:number>', 'Number of records in total to return.', { default: 10000 })
    .option('--retry <val:number>', 'Number of retry attempts per paginated requrest.', { default: 5 })
    .option('-i, --identifiers <val:boolean>', 'Only return identifiers, one per line, useful to input directly into queue.', { default: true })
    .option('--jsonl <val:boolean>', 'Print one object out per-line. Incompatible with --identifiers', { default: false })
    .arguments('[input:string]')
    .action(async ({
      page, rows, end, retry, identifiers, jsonl,
    }, input) => {
      if (input === undefined) {
        input = ''
        for await (const line of readLines(Deno.stdin)) {
          input += line
        }
      }
      const client = new Search(
        new QueryRaw(input),
        FieldTable,
        page,
        rows,
        end,
        retry,
      )
      const results = []
      for await (const result of client) {
        results.push(...result)
      }
      if (jsonl || identifiers) {
        results.forEach((item) => console.log(identifiers ? item.identifier : JSON.stringify(item)))
      } else {
        console.log(JSON.stringify(results))
      }
    })
}

export default searchCommands
