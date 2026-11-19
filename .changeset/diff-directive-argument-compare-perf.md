---
'@graphql-inspector/core': patch
---

Improve `diff()` performance on schemas with many directive usages (e.g. federation supergraphs). Directive argument values are now compared structurally instead of printing both AST values to strings.
