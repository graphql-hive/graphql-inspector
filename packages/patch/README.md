# GraphQL Change Patch

This package applies a list of changes (output from `@graphql-inspector/core`'s `diff`) to a GraphQL Schema.

## Usage

```typescript
import { buildSchema } from "graphql";
import { diff } from "@graphql-inspector/core";
import { patchSchema } from "@graphql-inspector/patch";

const schemaA = buildSchema(before, { assumeValid: true, assumeValidSDL: true });
const schemaB = buildSchema(after, { assumeValid: true, assumeValidSDL: true });

const changes = await diff(schemaA, schemaB);
const patched = patchSchema(schemaA, changes);
```

## Configuration

> By default does not throw when hitting errors such as if a type that was modified no longer exists.

`throwOnError?: boolean`

> By default does not require the value at time of change to match what's currently in the schema. Enable this if you need to be extra cautious when detecting conflicts.

`requireOldValueMatch?: boolean`

> Allows handling errors more granularly if you only care about specific types of errors or want to capture the errors in a list somewhere etc. If 'true' is returned then this error is considered handled and the default error handling will not be ran. To halt patching, throw the error inside the handler.

`onError?: (err: Error, change: Change<any>) => boolean | undefined | null`

> Enables debug logging

`debug?: boolean`

## Remaining Work

- [] Support type extensions
- [] Fully support schema operation types
