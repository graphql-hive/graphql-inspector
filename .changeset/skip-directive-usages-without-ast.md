---
'@graphql-inspector/core': minor
'@graphql-inspector/diff-command': patch
'@graphql-inspector/action': patch
---

`diff` no longer reports directive usages, such as `@deprecated`, as added or removed when one schema has no AST (for example, it was built from introspection). Those comparisons are skipped and reported once through the new optional `onWarning` option, which the CLI and GitHub Action print as a warning.
