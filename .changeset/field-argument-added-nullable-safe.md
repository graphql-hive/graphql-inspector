---
'@graphql-inspector/core': patch
---

`FIELD_ARGUMENT_ADDED` now reports a nullable argument without a default value, added to an existing
field, as `NON_BREAKING` instead of `DANGEROUS`: existing operations stay valid and the field receives
no value for the argument, exactly as before. The other cases are unchanged: a non-null argument without
a default value is `BREAKING`, and any argument with a default value is `DANGEROUS`, because operations
that do not provide it now receive the default. The change also carries a `criticality.reason` that
explains the assigned level.
