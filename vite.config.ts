import { join } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const usesLegacyGraphQL = /^graphql-(?:14|15|16)$/.test(mode);
  const graphqlPackage = usesLegacyGraphQL ? mode : 'graphql';

  return {
    resolve: {
      alias: [
        {
          find: /^graphql$/,
          replacement: join(__dirname, `node_modules/${graphqlPackage}/index.mjs`),
        },
        ...(usesLegacyGraphQL
          ? [
              {
                find: /^graphql\/(.*)$/,
                replacement: join(__dirname, `node_modules/${graphqlPackage}/$1`),
              },
            ]
          : []),
      ],
    },
    test: {
      globals: true,
      alias: {
        '@graphql-inspector/commands': 'packages/commands/commands/src/index.ts',
        '@graphql-inspector/loaders': 'packages/loaders/loaders/src/index.ts',
        '@graphql-inspector/logger': 'packages/logger/src/index.ts',
        '@graphql-inspector/url-loader': 'packages/loaders/url/src/index.ts',
        '@graphql-inspector/testing': 'packages/testing/src/index.ts',
        '@graphql-inspector/core': 'packages/core/src/index.ts',
        '@graphql-inspector/patch': 'packages/patch/src/index.ts',
      },
      setupFiles: ['./packages/testing/src/setup-file.ts'],
      ...(usesLegacyGraphQL
        ? {
            server: {
              deps: {
                inline: true,
              },
            },
          }
        : {}),
    },
    plugins: [
      tsconfigPaths({
        projects: [join(__dirname, 'tsconfig.test.json')],
      }),
    ],
  };
});
