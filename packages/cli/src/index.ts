#!/usr/bin/env node
import yargs, { Argv, CommandModule } from 'yargs';
import auditCommand from '@graphql-inspector/audit-command';
import codeLoader from '@graphql-inspector/code-loader';
import coverageCommand from '@graphql-inspector/coverage-command';
import diffCommand from '@graphql-inspector/diff-command';
import docsCommand from '@graphql-inspector/docs-command';
import gitLoader from '@graphql-inspector/git-loader';
import githubLoader from '@graphql-inspector/github-loader';
import graphqlLoader from '@graphql-inspector/graphql-loader';
import introspectCommand from '@graphql-inspector/introspect-command';
import jsonLoader from '@graphql-inspector/json-loader';
import { LoadersRegistry } from '@graphql-inspector/loaders';
import serveCommand from '@graphql-inspector/serve-command';
import similarCommand from '@graphql-inspector/similar-command';
import urlLoader from '@graphql-inspector/url-loader';
import validateCommand from '@graphql-inspector/validate-command';

async function main() {
  const config = {
    loaders: ['code', 'git', 'github', 'graphql', 'json', 'url'],
    commands: ['docs', 'serve', 'diff', 'validate', 'coverage', 'introspect', 'similar', 'audit'],
  };
  const loaders = new LoadersRegistry();
  for (const loader of [
    codeLoader,
    gitLoader,
    githubLoader,
    graphqlLoader,
    jsonLoader,
    urlLoader,
  ]) {
    loaders.register(loader);
  }
  // Each command has its own argument type, so the list is typed with `any` arguments
  const commands: CommandModule<{}, any>[] = [
    docsCommand,
    serveCommand,
    diffCommand,
    validateCommand,
    coverageCommand,
    introspectCommand,
    similarCommand,
    auditCommand,
  ].map(commandFactory => commandFactory({ config, loaders }));

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
