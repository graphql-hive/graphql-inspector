---
'@graphql-inspector/diff-command': major
---

Added option to include nested changes. Use `--rule verboseChanges`.
Added better directive support.
Adjusted severity level for conditionally safe changes:
- Adding or removing deprecated directive is considered non-breaking
- Adding an interface to a new type is non-breaking
- Adding an argument to a new field is non-breaking
- Adding a directive to a new object (type, interface, etc..) is non-breaking
