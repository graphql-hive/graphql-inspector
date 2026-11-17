---
'@graphql-inspector/action': patch
---

URL endpoints are now fetched with `Content-Type: application/json`, so servers that only parse JSON request bodies (for example Rails/graphql-ruby) no longer reply with "No query string was present".
