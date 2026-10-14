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
        projects: [join(__dirname, 'tsconfig.build.json'), join(__dirname, 'tsconfig.test.json')],
      }),
    ],
  };
});
