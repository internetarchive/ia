/* eslint-disable no-console */
/* eslint-disable no-empty-pattern */
import { Command } from 'https://deno.land/x/cliffy@v0.25.7/command/mod.ts'
import {
  QueryAnd,
  QueryDate, QueryMediaType, QueryNot, QueryOr, QueryRange, QueryRaw, QueryString,
} from '../lib/query.js'

function queryLog(fn = () => '', options = {}, ...args) {
  if (options.logLevel === 'info') {
    console.info(options, ...args)
  }
  try {
    console.log(fn())
  } catch (e) {
    if (options.logLevel === 'error') {
      console.error(e)
    }
  }
}

function queryCommands() {
  return new Command()
    .description('Collection of query types to be used with search.')
    .command('string', 'String type for query.')
    .option('-t, --type <val:string>', 'Type of string to search for.', { default: 'any' })
    .option('-c, --contains <val:boolean>', 'Query results should contain this string.', { default: true })
    .option('-f, --fuzzy <val:boolean>', 'Use fuzzy search for this string.', { default: false })
    .arguments('<string:string>')
    .action((options, string) => queryLog(() => new QueryString(
      options.type,
      string,
      options.contains,
      options.fuzzy,
    ).encode(), options, string))
    .command('mediatype', 'Media type for query.')
    .option('-i, --is <val:boolean>', 'Query results should contain this media type.', { default: true })
    .arguments('<mediaType:string>')
    .action((options, mediaType) => queryLog(() => new QueryMediaType(
      mediaType,
      options.is,
    ).encode(), options, mediaType))
    .command('raw', 'Raw type for query.')
    .arguments('<string:string>')
    .action((options, string) => queryLog(() => new QueryRaw(
      string,
    ).encode(), options, string))
    .command('date', 'Date type for query.')
    .arguments('<date:string> [to:string]')
    .action((options, date, to) => queryLog(() => new QueryDate(
      date,
      to,
    ).encode(), options, date, to))
    .command('range', 'Range type for query.')
    .option('-t, --type <val:string>', 'Type of range to search for.', { default: 'downloads' })
    .option('-i, --include <val:boolean>', 'Query results should contain this range.', { default: true })
    .arguments('<from:string> <to:string>')
    .action((options, from, to) => queryLog(() => new QueryRange(
      options.type,
      from,
      to,
      options.include,
    ).encode(), options, from, to))
    .command('and', 'And logical operator.')
    .arguments('<queries...>')
    .action((options, ...queries) => queryLog(() => {
      const collection = []
      queries.forEach((item) => collection.push(new QueryRaw(item)))
      console.log(new QueryAnd(...collection).encode())
    }, options, ...queries))
    .command('or', 'Or logical operator.')
    .arguments('<queries...>')
    .action((options, ...queries) => queryLog(() => {
      const collection = []
      queries.forEach((item) => collection.push(new QueryRaw(item)))
      console.log(new QueryOr(...collection).encode())
    }, options, ...queries))
    .command('not', 'Not logical operator.')
    .arguments('<input:string>')
    .action((options, input) => queryLog(() => new QueryNot(
      new QueryRaw(input),
    ).encode(), options, input))
}

export default queryCommands
