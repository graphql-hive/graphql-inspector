---
'@graphql-inspector/core': patch
---

Fix `validate` failing when a `...` sequence occurs inside a string literal in a query or
fragment. Fragment references are now collected from the parsed AST instead of a regular
expression over the printed document.
