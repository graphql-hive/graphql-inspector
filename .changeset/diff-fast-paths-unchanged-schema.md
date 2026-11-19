---
'@graphql-inspector/core': patch
---

Speed up `diff()` for large schemas where most of the schema is unchanged (e.g. federation supergraphs). Unchanged fields are now skipped with a single cheap check, and unchanged directive usages, lists, type references and scalar/enum default values are detected without allocating intermediate maps, strings or coerced values.
