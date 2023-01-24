import { Command, EnumType } from 'https://deno.land/x/cliffy@v0.25.7/command/mod.ts'
import { QueryString } from '../lib/query'

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
    .option('-t, --type: <val:string>', 'Type of string to search for', { default: 'any' })
    .option('-c, --contains <val:boolean>', 'Query results should contain this string.', { default: true })
    .option('-f, --fuzzy <val:boolean>', 'Use fuzzy search for this string.', { default: false })
    .arguments('<input:string> <output:string>')
    .action(({ type, contains, fuzzy }, input) => new QueryString(
      type,
      input,
      contains,
      fuzzy,
    ).encode())
  await main.parse(Deno.args)
}

if (import.meta.main) {
  ia().finally()
}
