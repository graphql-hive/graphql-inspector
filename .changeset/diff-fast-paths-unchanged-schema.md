---
'@graphql-inspector/core': patch
---

Speed up `diff()` for large schemas where most of the schema is unchanged (e.g. federation supergraphs). Unchanged directive usages, directive lists, type references and scalar/enum default values are now detected without allocating intermediate maps, strings or coerced values.
