---
'@graphql-inspector/cli': minor
'@graphql-inspector/commands': minor
'@graphql-inspector/introspect-command': minor
'@graphql-inspector/diff-command': minor
'@graphql-inspector/validate-command': minor
---

Add the global `--include-deprecated-input-values` and `--include-repeatable-directives` options.

When a schema is loaded from a URL, graphql-js's default introspection query leaves out deprecated
input fields/arguments (`inputFields(includeDeprecated: false)`) and does not request the
`repeatable` flag of directives. The new options forward graphql-js's `inputValueDeprecation` and
`directiveIsRepeatable` introspection options, so `introspect`, `diff` and `validate` can see the
full schema. Both default to `false`, so existing behavior is unchanged.
