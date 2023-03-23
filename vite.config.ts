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
    },
    deps: {
      // fixes `graphql` Duplicate "graphql" modules cannot be used at the same time since different
      fallbackCJS: true,
    },
    setupFiles: ['./packages/testing/src/setup-file.ts'],
  },
});
