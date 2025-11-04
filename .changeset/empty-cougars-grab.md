---
'@graphql-inspector/patch': patch
---

Initial release. Patch applies a list of changes (output from `@graphql-inspector/core`'s `diff`) to
a GraphQL Schema.

Example usage:

```typescript
import { buildSchema } from "graphql";
import { diff } from "@graphql-inspector/core";
import { patchSchema } from "@graphql-inspector/patch";

const schemaA = buildSchema(before, { assumeValid: true, assumeValidSDL: true });
const schemaB = buildSchema(after, { assumeValid: true, assumeValidSDL: true });

const changes = await diff(schemaA, schemaB);
const patched = patchSchema(schemaA, changes);
```
