---
'@graphql-inspector/patch': patch
'@graphql-inspector/core': patch
---

Add support for "extend schema" syntax to @graphql-inspector/core's "diff" function and
@graphql/inspector/patch. This allows directives to be defined on the schema such as "extend schema
@link(...)" for federation
