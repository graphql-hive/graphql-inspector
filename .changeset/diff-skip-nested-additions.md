---
'@graphql-inspector/core': patch
---

Speed up `diff` with the `simplifyChanges` rule for large schema additions. The changes nested under an added type or directive (its fields, arguments, directive usages, ...) are no longer computed, since `simplifyChanges` removes them anyway. The result is unchanged, but rules that run before `simplifyChanges` no longer receive these nested changes.
