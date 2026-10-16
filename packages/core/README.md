# GraphQL Inspector

[![CircleCI](https://circleci.com/gh/graphql-hive/graphql-inspector.svg?style=shield&circle-token=d1cd06aba321ee2b7bf8bd2041104643639463b0)](https://circleci.com/gh/graphql-hive/graphql-inspector)
[![npm version](https://badge.fury.io/js/@graphql-inspector/core.svg)](https://npmjs.com/package/@graphql-inspector/core)

**GraphQL Inspector** outputs a list of changes between two GraphQL schemas. Every change is
precisely explained and marked as breaking, non-breaking or dangerous. It helps you validate
documents and fragments against a schema and even find similar or duplicated types.

## Features

Major features:

- **Compares schemas**
- **Finds breaking or dangerous changes**
- **Validates documents against a schema**
- **Finds similar / duplicated types**
- **Schema coverage based on documents**
- **Serves a GraphQL server with faked data and GraphQL Playground**

GraphQL Inspector has a **CLI** and also a **programmatic API**, so you can use it however you want
to and even build tools on top of it.

## Installation

```bash
pnpm add @graphql-inspector/core
```

## Examples

```typescript
import {
  diff,
  validate,
  similar,
  coverage,
  Change,
  InvalidDocument,
  SimilarMap,
  SchemaCoverage
} from '@graphql-inspector/core'

// diff
const changes: Change[] = diff(schemaA, schemaB)
// validate
const invalid: InvalidDocument[] = validate(documentsGlob, schema)
// similar
const similar: SimilarMap = similar(schema, typename, threshold)
// coverage
const schemaCoverage: SchemaCoverage = coverage(schema, documents)
// ...
```

### Diff warnings

`diff` skips directive usage comparison for nodes where only one schema has an AST, for example
when one schema was built from introspection. Pass `onWarning` to be told which paths were skipped:

```typescript
import { diff } from '@graphql-inspector/core'

const changes = await diff(oldSchema, newSchema, [], undefined, {
  onWarning(warning) {
    console.warn(warning.message, warning.paths)
  }
})
```

## License

[MIT](https://github.com/graphql-hive/graphql-inspector/blob/master/LICENSE) © Kamil Kisiela
