/* eslint-disable no-console */
/* eslint-disable no-empty-pattern */
import { Command } from 'https://deno.land/x/cliffy@v0.25.7/command/mod.ts'
import {
  QueryAnd,
  QueryDate, QueryMediaType, QueryNot, QueryOr, QueryRange, QueryRaw, QueryString,
} from '../lib/query.js'

function queryCommands() {
  return new Command()
    .command('string', 'String type for query.')
    .option('-t, --type <val:string>', 'Type of string to search for.', { default: 'any' })
    .option('-c, --contains <val:boolean>', 'Query results should contain this string.', { default: true })
    .option('-f, --fuzzy <val:boolean>', 'Use fuzzy search for this string.', { default: false })
    .arguments('<string:string>')
    .action(({ type, contains, fuzzy }, string) => console.log(new QueryString(
      type,
      string,
      contains,
      fuzzy,
    ).encode()))
    .command('mediatype', 'Media type for query.')
    .option('-i, --is <val:boolean>', 'Query results should contain this media type.', { default: true })
    .arguments('<mediaType:string>')
    .action(({ is }, mediaType) => console.log(new QueryMediaType(
      mediaType,
      is,
    ).encode()))
    .command('raw', 'Raw type for query.')
    .arguments('<string:string>')
    .action(({}, string) => console.log(new QueryRaw(
      string,
    ).encode()))
    .command('date', 'Date type for query.')
    .option('-t, --to <val:string>', 'Include dates up to.')
    .arguments('<date:string>')
    .action(({ to }, date) => console.log(new QueryDate(
      date,
      to,
    ).encode()))
    .command('range', 'Range type for query.')
    .option('-t, --type <val:string>', 'Type of range to search for.', { default: 'downloads' })
    .option('-i, --include <val:boolean>', 'Query results should contain this range.', { default: true })
    .arguments('<from:string> <to:string>')
    .action(({ type, include }, from, to) => console.log(new QueryRange(
      type,
      from,
      to,
      include,
    ).encode()))
    .command('and', 'And logical operator.')
    .arguments('[queries:string]')
    .action(({}, ...queries) => {
      const collection = []
      queries.forEach((item) => collection.push(new QueryRaw(item)))
      console.log(new QueryAnd(...collection).encode())
    })
    .command('or', 'Or logical operator.')
    .arguments('[queries:string]')
    .action(({}, ...queries) => {
      const collection = []
      queries.forEach((item) => collection.push(new QueryRaw(item)))
      console.log(new QueryOr(...collection).encode())
    })
    .command('not', 'Not logical operator.')
    .arguments('<input:string>')
    .action(({}, input) => console.log(new QueryNot(
      new QueryRaw(input),
    ).encode()))
}

export default queryCommands
