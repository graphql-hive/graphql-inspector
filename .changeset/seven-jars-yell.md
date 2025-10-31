---
'@graphql-inspector/core': major
---

This is a major change to `@graphql-inspector/core` and introduces a new `@graphql-inspector/patch` package, which applies changes output from `diff` on top of a schema -- essentially rebasing these changes onto any schema.

These changes include:
- Numerous adjustments to Change types to create more accurate severity levels, such as a boolean indicating if the change applies to a new type or an existing type.
- Adjustmented the "path" on several change types in order to consistently map to the exact AST node being changed. For example, `EnumValueDeprecationReasonAdded`'s path previously referenced the enumValue (e.g. `EnumName.value`), not the deprecated directive (e.g. `EnumName.value.@deprecated`).
- Added new attributes in order to provide enough context for a new "@graphql-inspector/patch" function to apply changes accurately.
- Added support for repeatable directives
- Includes all nested changes in `diff` output when a new node is added. This can dramatically increase the number of changes listed which can be noisy, but it makes it possible for "@graphql-inspector/patch" to apply all changes from a schema. This can be optionally filtered using a newly exported `DiffRule.ignoreNestedAdditions` rule.

For example, given an existing schema:

```graphql
type User {
  id: ID!
  name: String!
}
```

And a diff schema:

```graphql
type User {
  id: ID!
  name: String!
  address: Address
}

type Address {
  line1: String!
  line2: String!
}
```

Then previously the output would be:

```json
[
  {
    "criticality": {
      "level": "NON_BREAKING",
    },
    "message": "Type 'Address' was added",
    "meta": {
      "addedTypeKind": "ObjectTypeDefinition",
      "addedTypeName": "Address",
    },
    "path": "Address",
    "type": "TYPE_ADDED",
  },
  {
    "criticality": {
      "level": "NON_BREAKING",
    },
    "message": "Field 'address' was added to object type 'User'",
    "meta": {
      "addedFieldName": "address",
      "addedFieldReturnType": "Address",
      "typeName": "User",
      "typeType": "object type",
    },
    "path": "User.address",
    "type": "FIELD_ADDED",
  },
]
```

But now the output also includes the fields inside the new `Address` type:

```json
[
  {
    "criticality": {
      "level": "NON_BREAKING",
    },
    "message": "Type 'Address' was added",
    "meta": {
      "addedTypeKind": "ObjectTypeDefinition",
      "addedTypeName": "Address",
    },
    "path": "Address",
    "type": "TYPE_ADDED",
  },
  {
    "criticality": {
      "level": "NON_BREAKING",
    },
    "message": "Field 'line1' was added to object type 'Address'",
    "meta": {
      "addedFieldName": "line1",
      "addedFieldReturnType": "String!",
      "typeName": "Address",
      "typeType": "object type",
    },
    "path": "Address.line1",
    "type": "FIELD_ADDED",
  },
  {
    "criticality": {
      "level": "NON_BREAKING",
    },
    "message": "Field 'line2' was added to object type 'Address'",
    "meta": {
      "addedFieldName": "line2",
      "addedFieldReturnType": "String!",
      "typeName": "Address",
      "typeType": "object type",
    },
    "path": "Address.line2",
    "type": "FIELD_ADDED",
  },
  {
    "criticality": {
      "level": "NON_BREAKING",
    },
    "message": "Field 'address' was added to object type 'User'",
    "meta": {
      "addedFieldName": "address",
      "addedFieldReturnType": "Address",
      "typeName": "User",
      "typeType": "object type",
    },
    "path": "User.address",
    "type": "FIELD_ADDED",
  },
]
```

These additional changes can be filtered using a new rule:

```js
import { DiffRule, diff } from "@graphql-inspector/core";
const changes = await diff(a, b, [DiffRule.ignoreNestedAdditions]);
```

To apply the changes output to a schema using `patch`:

```js
const schemaA = buildSchema(before, { assumeValid: true, assumeValidSDL: true });
const schemaB = buildSchema(after, { assumeValid: true, assumeValidSDL: true });

const changes = await diff(schemaA, schemaB);
const patched = patchSchema(schemaA, changes);
expect(printSortedSchema(schemaB)).toBe(printSortedSchema(patched));
```

If working from an AST, you may alternatively use the exported `patch` function. But be careful to make sure directives are included in your AST or those changes will be missed.
