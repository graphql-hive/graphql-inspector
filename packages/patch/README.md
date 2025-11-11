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

### `debug?: boolean`

> Enables debug logging

### `onError?: (err: Error, change: Change<any>) => void`

> Define how you want errors to be handled. This package exports three predefined error handlers: `errors.strictErrorHandler`, `errors.defaultErrorHandler`, and `errors.looseErrorHandler`. Strict is recommended if you want to manually resolve value conflicts.

> [!CAUTION]
> Error classes are still being actively improved. It's recommended to use one of the exported error functions rather than build your own at this time.

#### `defaultErrorHandler`

A convenient, semi-strict error handler. This ignores "no-op" errors -- if
the change wouldn't impact the patched schema at all. And it ignores
value mismatches, which are when the change notices that the value captured in
the change doesn't match the value in the patched schema.

For example, if the change indicates the default value WAS "foo" before being
changed, but the patch is applied to a schema where the default value is "bar".
This is useful to avoid overwriting changes unknowingly that may have occurred
from other sources.

#### `strictErrorHandler`

The strictest of the standard error handlers. This checks if the error is a "No-op",
meaning if the change wouldn't impact the schema at all, and ignores the error
only in this one case. Otherwise, the error is raised.

#### `looseErrorHandler`

The least strict error handler. This will only log errors and will never
raise an error. This is potentially useful for getting a patched schema
rendered, and then handling the conflict/error in a separate step. E.g.
if creating a merge conflict resolution UI.

## Remaining Work

- [] Support type extensions
- [] Fully support schema operation types
