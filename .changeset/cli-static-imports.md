---
'@graphql-inspector/cli': patch
---

Fix the Docker image crashing on startup with a missing `code-loader` module. The CLI now imports its loaders and commands statically instead of resolving them by name at runtime, so they are always bundled and found regardless of the package manager's `node_modules` layout.
