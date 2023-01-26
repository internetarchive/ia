/* eslint-disable no-empty-pattern */
import {
  QueryAnd,
  QueryDate, QueryMediaType, QueryNot, QueryOr, QueryRange, QueryRaw, QueryString,
} from '../lib/query.js'

function queryCommands(main) {
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
}

export default queryCommands
