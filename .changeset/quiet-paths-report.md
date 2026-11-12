---
'@graphql-inspector/core': patch
---

`simplifyChanges` no longer hides changes to a field, input field, type or directive when a description, interface, union member or directive location was added to that same node in the diff. Breaking changes such as a newly required argument, a changed type or a removed field are reported again.
