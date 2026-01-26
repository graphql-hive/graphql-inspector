# @graphql-inspector/patch

## 0.1.2

### Patch Changes

- [#2934](https://github.com/graphql-hive/graphql-inspector/pull/2934)
  [`14b4410`](https://github.com/graphql-hive/graphql-inspector/commit/14b4410d68e71275f3468e764442e11618103a02)
  Thanks [@jdolle](https://github.com/jdolle)! - Add support for "extend schema" syntax to
  `@graphql-inspector/core`'s `diff` function and `@graphql/inspector/patch`. This allows directives
  to be defined on the schema such as `extend schema @link(...)` for federation

## 0.1.1

### Patch Changes

- [#2930](https://github.com/graphql-hive/graphql-inspector/pull/2930)
  [`4a37c05`](https://github.com/graphql-hive/graphql-inspector/commit/4a37c05a03e5c8755550a69e9fe23bd83b2cd0c9)
  Thanks [@jdolle](https://github.com/jdolle)! - Add directive definition changes first; adjust
  adding repeat directive change

## 0.1.0

### Minor Changes

- [#2923](https://github.com/graphql-hive/graphql-inspector/pull/2923)
  [`9bfc094`](https://github.com/graphql-hive/graphql-inspector/commit/9bfc094ab3e3529f6ed4e68ecd250d496b88e23e)
  Thanks [@jdolle](https://github.com/jdolle)! - Adjust SCHEMA\_\*\_TYPE_CHANGED changes to use null
  instead of 'unknown' when these types are not defined and improve the change messages.

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
