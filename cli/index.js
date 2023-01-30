/* eslint-disable no-empty-pattern */
import { Command, EnumType } from 'https://deno.land/x/cliffy@v0.25.7/command/mod.ts'
import queryCommands from './query.js'
import searchCommands from './search.js'
import queueCommands from './queue.js'

const logLevelType = new EnumType(['debug', 'info', 'warn', 'error'])

async function ia() {
  await new Command()
    .name('ia')
    .version('0.1.0')
    .description('Command line interface for interacting with IA APIs.')
    .type('log-level', logLevelType)
    .env('DEBUG=<enable:boolean>', 'Enable debug output.')
    .globalOption('-d, --debug', 'Enable debug output.')
    .globalOption('-l, --log-level <level:log-level>', 'Set log level.', {
      default: 'info',
    })
    .command('query', queryCommands())
    .command('search', searchCommands())
    .command('queue', queueCommands())
    .parse(Deno.args)
}

if (import.meta.main) {
  ia().finally()
}
