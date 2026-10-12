---
'@graphql-inspector/action': patch
---

Send check-run annotation batches to the GitHub Checks API sequentially instead of
concurrently, avoiding `write EPIPE` crashes when a schema diff produces hundreds of
annotations.
