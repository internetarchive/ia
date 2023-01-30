/* eslint-disable no-console */
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
    .option('-i, --identifiers <val:boolean>', 'Only return identifiers, useful to input directly into queue.', { default: false })
    .arguments('<input:string>')
    .action(async ({
      page, rows, end, retry, identifiers,
    }, input) => {
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
        if (!identifiers) {
          results.push(...result)
        } else {
          result.forEach((item) => results.push(item.identifier))
        }
      }
      console.log(JSON.stringify(results))
    })
}

export default searchCommands
