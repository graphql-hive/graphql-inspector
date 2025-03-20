import { join } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    alias: {
      '@graphql-inspector/commands': 'packages/commands/commands/src/index.ts',
      '@graphql-inspector/loaders': 'packages/loaders/loaders/src/index.ts',
      '@graphql-inspector/logger': 'packages/logger/src/index.ts',
      '@graphql-inspector/url-loader': 'packages/loaders/url/src/index.ts',
      '@graphql-inspector/testing': 'packages/testing/src/index.ts',
      '@graphql-inspector/core': 'packages/core/src/index.ts',
      'graphql/language/parser.js': 'graphql/language/parser.js',
      graphql: 'graphql/index.js',
    },
    deps: {
      // fixes `graphql` Duplicate "graphql" modules cannot be used at the same time since different
      fallbackCJS: true,
    },
    setupFiles: ['./packages/testing/src/setup-file.ts'],
  },
  plugins: [
    tsconfigPaths({
      projects: [join(__dirname, 'tsconfig.test.json')],
    }),
  ],
});
