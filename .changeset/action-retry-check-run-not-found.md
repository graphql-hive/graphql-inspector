---
'@graphql-inspector/action': patch
---

Retry check run updates when GitHub answers 404 for a check run the action has just created. Each
update, including the annotation batches, is retried up to three times (1s, 2s, 4s) and only for
404; any other error fails the action as before.
