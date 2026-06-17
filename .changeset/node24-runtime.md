---
'@graphql-inspector/action': patch
---

Update GitHub Action runtime from `node20` to `node24`.

GitHub Actions deprecated Node 20 (https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/) and now runs `using: node20` actions on Node 24 by default. On Node 24, `globalThis.navigator` is a built-in read-only getter, so the legacy `global.navigator = { userAgent: 'node.js' }` assignment in the action bundle threw `TypeError: Cannot set property navigator of #<Object> which has only a getter` at startup, breaking every workflow that consumed this action.

This release removes the obsolete `global.navigator` assignment (Node 24 provides `navigator.userAgent` natively), bumps `runs.using` to `node24` in `action.yml`, and regenerates the bundle. Workflows that pin this action will now execute on the Node 24 runtime.
