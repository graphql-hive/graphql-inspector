---
'@graphql-inspector/core': patch
---

"INPUT_FIELD_ADDED" is now classified as Dangerous (was NonBreaking) when the added field has a default value, since rolling deploys can expose consumers to the default before producers are ready.
