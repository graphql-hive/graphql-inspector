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

> The changes output from `diff` include the values, such as default argument values of the old schema. E.g. changing `foo(arg: String = "bar")` to `foo(arg: String = "foo")` would track that the previous default value was `"bar"`. By enabling this option, `patch` can throw an error when patching a schema where the value doesn't match what is expected. E.g. where `foo.arg`'s default value is _NOT_ `"bar"`. This will avoid overwriting conflicting changes. This is recommended if using an automated process for patching schema.

`requireOldValueMatch?: boolean`

> Allows handling errors more granularly if you only care about specific types of errors or want to capture the errors in a list somewhere etc. If 'true' is returned then this error is considered handled and the default error handling will not be ran. To halt patching, throw the error inside the handler.

`onError?: (err: Error, change: Change<any>) => boolean | undefined | null`

> Enables debug logging

`debug?: boolean`

## Remaining Work

- [] Support type extensions
- [] Fully support schema operation types
