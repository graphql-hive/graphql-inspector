---
'@graphql-inspector/core': patch
---

`DIRECTIVE_ARGUMENT_ADDED` now takes the argument's default value into account, the same way
`FIELD_ARGUMENT_ADDED` does. Adding an argument with a default value to an existing directive is
reported as `DANGEROUS` instead of `BREAKING` (non-null) or `NON_BREAKING` (nullable). Adding a
non-null argument without a default value is still `BREAKING`.
