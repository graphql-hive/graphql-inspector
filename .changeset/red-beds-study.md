---
'@graphql-inspector/core': patch
---

Fix simplifyChanges for sibling changes. E.g. if User.foo and User.bar were added, then the later would be filtered out when it shouldn't be filtered.
