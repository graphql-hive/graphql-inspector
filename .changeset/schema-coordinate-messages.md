---
'@graphql-inspector/core': minor
---

Change messages now name schema elements with GraphQL schema coordinates, for example
`Object field 'Product.name' was added` or `Directive '@feature' was added`. The wording of most
messages changed, so anyone matching on message text should update their patterns.
