---
'@graphql-inspector/core': patch
---

`simplifyChanges` no longer hides changes to a node when a description, interface, union member or directive location was added to that same node in the diff. The rule treated those additions like the addition of a whole node, so every later change at the same path or directly below it was dropped. The following changes were hidden before and are reported again:

- On a field whose description was added: `FIELD_TYPE_CHANGED`, `FIELD_ARGUMENT_ADDED`, `FIELD_ARGUMENT_REMOVED`, `FIELD_ARGUMENT_TYPE_CHANGED`, `FIELD_DEPRECATION_ADDED` and `DIRECTIVE_USAGE_FIELD_DEFINITION_ADDED`.
- On an input field whose description was added: `INPUT_FIELD_TYPE_CHANGED`, `INPUT_FIELD_DEFAULT_VALUE_CHANGED` and `DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_ADDED`.
- On a type that gained an interface: `FIELD_ADDED`, `FIELD_REMOVED` and `FIELD_TYPE_CHANGED` on that type, `DIRECTIVE_USAGE_OBJECT_ADDED`, and every `OBJECT_TYPE_INTERFACE_ADDED` after the first.
- On a union that gained a member: every `UNION_MEMBER_ADDED` after the first, and `DIRECTIVE_USAGE_UNION_MEMBER_ADDED`.
- On a directive that gained a location: `DIRECTIVE_LOCATION_REMOVED`, every `DIRECTIVE_LOCATION_ADDED` after the first, `DIRECTIVE_ARGUMENT_ADDED`, `DIRECTIVE_ARGUMENT_REMOVED`, `DIRECTIVE_ARGUMENT_TYPE_CHANGED` and `DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED`.
