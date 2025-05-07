#!/usr/bin/env node
import yargs, { Argv } from 'yargs';
import { useCommands } from '@graphql-inspector/commands';
import { useLoaders } from '@graphql-inspector/loaders';

async function main() {
  const config = {
    loaders: ['code', 'git', 'github', 'graphql', 'json', 'url'],
    commands: ['docs', 'serve', 'diff', 'validate', 'coverage', 'introspect', 'similar', 'audit'],
  };
  const loaders = useLoaders(config);
  const commands = useCommands({ config, loaders });

  const root: Argv = yargs
    .scriptName('graphql-inspector')
    .detectLocale(false)
    .epilog('Visit https://graphql-inspector.com for more information')
    .version()
    .options({
      r: {
        alias: 'require',
        describe: 'Require modules',
        type: 'array',
      },
      t: {
        alias: 'token',
        describe: 'Access Token',
        type: 'string',
      },
      h: {
        alias: 'header',
        describe: 'Http Header',
        type: 'array',
      },
      hl: {
        alias: 'left-header',
        describe: 'Http Header - Left',
        type: 'array',
      },
      hr: {
        alias: 'right-header',
        describe: 'Http Header - Right',
        type: 'array',
      },
    });

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  commands
    .reduce((cli, cmd) => cli.command(cmd), root)
    .help()
    .showHelpOnFail(false).argv;
}

main();
