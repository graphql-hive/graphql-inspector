---
'@graphql-inspector/core': patch
---

`simplifyChanges` no longer drops changes because a description, deprecation, or directive usage
was added on the same node, and its result no longer depends on the order of the input changes. Only
whole-node additions (types, fields, input fields, enum values, directives) hide the changes they
contain, so breaking changes such as a field type change are kept when the field also gains a
description.
