# GraphQL Change Comparison Utility

This package allows comparing two changes (output from `@graphql-inspector/core`'s `diff`) for determining if they would result in the same output.

## Usage

```typescript
import { buildSchema } from 'graphql';
import { diff } from '@graphql-inspector/diff';
import { isChangeEqual } from '@graphql-inspector/compare-changes';

const before = buildSchema(/* existing SDL */);
const after = buildSchema(/* new SDL */);
const changes = diff(before, after);

const hasChange = changes.some((c) => isChangeEqual(c, existingChange));
```
