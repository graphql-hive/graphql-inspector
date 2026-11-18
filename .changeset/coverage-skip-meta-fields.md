---
'@graphql-inspector/core': patch
---

`coverage()` no longer throws when a document selects the `__type` introspection field. All
`__`-prefixed meta-fields (`__typename`, `__schema`, `__type`) are skipped.
