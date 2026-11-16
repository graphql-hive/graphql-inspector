---
'@graphql-inspector/action': patch
---

Retry completing the check run when GitHub answers 404 right after the action created it. The update
is retried up to three times (1s, 2s, 4s) and only for 404; any other error fails the action as before.
