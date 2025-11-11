# @graphql-inspector/patch

## 0.0.1

### Patch Changes

- [#2893](https://github.com/graphql-hive/graphql-inspector/pull/2893)
  [`ef13125`](https://github.com/graphql-hive/graphql-inspector/commit/ef131254cc4f33efa52e8e48b842cdbd35f50d00)
  Thanks [@jdolle](https://github.com/jdolle)! - Initial release. Patch applies a list of changes
  (output from `@graphql-inspector/core`'s `diff`) to a GraphQL Schema.

  Example usage:

  ```typescript
  import { buildSchema } from 'graphql'
  import { diff } from '@graphql-inspector/core'
  import { patchSchema } from '@graphql-inspector/patch'

  const schemaA = buildSchema(before, { assumeValid: true, assumeValidSDL: true })
  const schemaB = buildSchema(after, { assumeValid: true, assumeValidSDL: true })

  const changes = await diff(schemaA, schemaB)
  const patched = patchSchema(schemaA, changes)
  ```

  If working from an AST, you may alternatively use the exported `patch` function. But be careful to
  make sure directives are included in your AST or those changes will be missed.
