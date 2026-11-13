---
'@graphql-inspector/core': minor
'@graphql-inspector/diff-command': patch
'@graphql-inspector/action': patch
---

`diff` no longer reports directive usages, such as `@deprecated`, as added or removed when one of the two schemas has no AST (for example, it was built from introspection). Those comparisons are skipped for the whole diff. When exactly one schema has an AST, the new optional `onWarning` option is called once with `{ message }`, which the CLI and GitHub Action print as a warning.
