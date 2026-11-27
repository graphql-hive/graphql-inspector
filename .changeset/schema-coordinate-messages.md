---
'@graphql-inspector/core': minor
---

Change messages now name schema elements with GraphQL schema coordinates, for example
`Object field 'Product.name' was added` or `Directive '@feature' was added`. Directive usage
argument messages also name where the directive is applied, for example
`Argument 'name' was added to '@tag' on field 'Query.a'`. The wording of most messages changed, so
anyone matching on message text should update their patterns.
