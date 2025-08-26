import {
  ASTNode,
  buildASTSchema,
  DocumentNode,
  GraphQLSchema,
  isDefinitionNode,
  Kind,
  parse,
  visit,
} from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import {
  directiveUsageArgumentAdded,
  directiveUsageArgumentDefinitionAdded,
  directiveUsageArgumentDefinitionRemoved,
  directiveUsageArgumentRemoved,
  directiveUsageEnumAdded,
  directiveUsageEnumRemoved,
  directiveUsageEnumValueAdded,
  directiveUsageEnumValueRemoved,
  directiveUsageFieldAdded,
  directiveUsageFieldDefinitionAdded,
  directiveUsageFieldDefinitionRemoved,
  directiveUsageFieldRemoved,
  directiveUsageInputFieldDefinitionAdded,
  directiveUsageInputFieldDefinitionRemoved,
  directiveUsageInputObjectAdded,
  directiveUsageInputObjectRemoved,
  directiveUsageInterfaceAdded,
  directiveUsageInterfaceRemoved,
  directiveUsageObjectAdded,
  directiveUsageObjectRemoved,
  directiveUsageScalarAdded,
  directiveUsageScalarRemoved,
  directiveUsageSchemaAdded,
  directiveUsageSchemaRemoved,
  directiveUsageUnionMemberAdded,
  directiveUsageUnionMemberRemoved,
} from './patches/directive-usages.js';
import {
  directiveAdded,
  directiveArgumentAdded,
  directiveArgumentDefaultValueChanged,
  directiveArgumentDescriptionChanged,
  directiveArgumentRemoved,
  directiveArgumentTypeChanged,
  directiveDescriptionChanged,
  directiveLocationAdded,
  directiveLocationRemoved,
  directiveRemoved,
} from './patches/directives.js';
import {
  enumValueAdded,
  enumValueDeprecationReasonAdded,
  enumValueDeprecationReasonChanged,
  enumValueDescriptionChanged,
  enumValueRemoved,
} from './patches/enum.js';
import {
  fieldAdded,
  fieldArgumentAdded,
  fieldArgumentDefaultChanged,
  fieldArgumentDescriptionChanged,
  fieldArgumentRemoved,
  fieldArgumentTypeChanged,
  fieldDeprecationAdded,
  fieldDeprecationReasonAdded,
  fieldDeprecationReasonChanged,
  fieldDeprecationRemoved,
  fieldDescriptionAdded,
  fieldDescriptionChanged,
  fieldDescriptionRemoved,
  fieldRemoved,
  fieldTypeChanged,
} from './patches/fields.js';
import {
  inputFieldAdded,
  inputFieldDefaultValueChanged,
  inputFieldDescriptionAdded,
  inputFieldDescriptionChanged,
  inputFieldDescriptionRemoved,
  inputFieldRemoved,
  inputFieldTypeChanged,
} from './patches/inputs.js';
import { objectTypeInterfaceAdded, objectTypeInterfaceRemoved } from './patches/interfaces.js';
import {
  schemaMutationTypeChanged,
  schemaQueryTypeChanged,
  schemaSubscriptionTypeChanged,
} from './patches/schema.js';
import {
  typeAdded,
  typeDescriptionAdded,
  typeDescriptionChanged,
  typeDescriptionRemoved,
  typeRemoved,
} from './patches/types.js';
import { unionMemberAdded, unionMemberRemoved } from './patches/unions.js';
import { PatchConfig, SchemaNode } from './types.js';
import { debugPrintChange } from './utils.js';

export * as errors from './errors.js';

export function patchSchema(
  schema: GraphQLSchema,
  changes: Change<any>[],
  config?: PatchConfig,
): GraphQLSchema {
  const ast = parse(printSchemaWithDirectives(schema, { assumeValid: true }));
  const patchedAst = patch(ast, changes, config);
  return buildASTSchema(patchedAst, { assumeValid: true, assumeValidSDL: true });
}

function groupNodesByPath(ast: DocumentNode): [SchemaNode[], Map<string, ASTNode>] {
  const schemaNodes: SchemaNode[] = [];
  const nodeByPath = new Map<string, ASTNode>();
  const pathArray: string[] = [];
  visit(ast, {
    enter(node) {
      switch (node.kind) {
        case Kind.ARGUMENT:
        case Kind.ENUM_TYPE_DEFINITION:
        case Kind.ENUM_TYPE_EXTENSION:
        case Kind.ENUM_VALUE_DEFINITION:
        case Kind.FIELD_DEFINITION:
        case Kind.INPUT_OBJECT_TYPE_DEFINITION:
        case Kind.INPUT_OBJECT_TYPE_EXTENSION:
        case Kind.INPUT_VALUE_DEFINITION:
        case Kind.INTERFACE_TYPE_DEFINITION:
        case Kind.INTERFACE_TYPE_EXTENSION:
        case Kind.OBJECT_FIELD:
        case Kind.OBJECT_TYPE_DEFINITION:
        case Kind.OBJECT_TYPE_EXTENSION:
        case Kind.SCALAR_TYPE_DEFINITION:
        case Kind.SCALAR_TYPE_EXTENSION:
        case Kind.UNION_TYPE_DEFINITION:
        case Kind.UNION_TYPE_EXTENSION: {
          pathArray.push(node.name.value);
          const path = pathArray.join('.');
          nodeByPath.set(path, node);
          break;
        }
        case Kind.DIRECTIVE_DEFINITION: {
          pathArray.push(`@${node.name.value}`);
          const path = pathArray.join('.');
          nodeByPath.set(path, node);
          break;
        }
        case Kind.DIRECTIVE: {
          /**
           * Check if this directive is on the schema node. If so, then push an empty path
           * to distinguish it from the definitions
           */
          const isRoot = pathArray.length === 0;
          if (isRoot) {
            pathArray.push(`.@${node.name.value}`);
          } else {
            pathArray.push(`@${node.name.value}`);
          }
          const path = pathArray.join('.');
          nodeByPath.set(path, node);
          break;
        }
        case Kind.DOCUMENT: {
          break;
        }
        case Kind.SCHEMA_EXTENSION:
        case Kind.SCHEMA_DEFINITION: {
          schemaNodes.push(node);
          break;
        }
        // default: {

        //   // by definition this things like return types, names, named nodes...
        //   // it's nothing we want to collect.
        //   return false;
        // }
      }
    },
    leave(node) {
      switch (node.kind) {
        case Kind.ARGUMENT:
        case Kind.ENUM_TYPE_DEFINITION:
        case Kind.ENUM_TYPE_EXTENSION:
        case Kind.ENUM_VALUE_DEFINITION:
        case Kind.FIELD_DEFINITION:
        case Kind.INPUT_OBJECT_TYPE_DEFINITION:
        case Kind.INPUT_OBJECT_TYPE_EXTENSION:
        case Kind.INPUT_VALUE_DEFINITION:
        case Kind.INTERFACE_TYPE_DEFINITION:
        case Kind.INTERFACE_TYPE_EXTENSION:
        case Kind.OBJECT_FIELD:
        case Kind.OBJECT_TYPE_DEFINITION:
        case Kind.OBJECT_TYPE_EXTENSION:
        case Kind.SCALAR_TYPE_DEFINITION:
        case Kind.SCALAR_TYPE_EXTENSION:
        case Kind.UNION_TYPE_DEFINITION:
        case Kind.UNION_TYPE_EXTENSION:
        case Kind.DIRECTIVE_DEFINITION:
        case Kind.DIRECTIVE: {
          pathArray.pop();
          break;
        }
      }
    },
  });
  return [schemaNodes, nodeByPath];
}

export function patch(
  ast: DocumentNode,
  changes: Change<any>[],
  patchConfig?: PatchConfig,
): DocumentNode {
  const config: PatchConfig = patchConfig ?? {};

  const [schemaDefs, nodeByPath] = groupNodesByPath(ast);

  for (const change of changes) {
    if (config.debug) {
      debugPrintChange(change, nodeByPath);
    }

    switch (change.type) {
      case ChangeType.SchemaMutationTypeChanged: {
        schemaMutationTypeChanged(change, schemaDefs, config);
        break;
      }
      case ChangeType.SchemaQueryTypeChanged: {
        schemaQueryTypeChanged(change, schemaDefs, config);
        break;
      }
      case ChangeType.SchemaSubscriptionTypeChanged: {
        schemaSubscriptionTypeChanged(change, schemaDefs, config);
        break;
      }
      case ChangeType.DirectiveAdded: {
        directiveAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveRemoved: {
        directiveRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveArgumentAdded: {
        directiveArgumentAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveArgumentRemoved: {
        directiveArgumentRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveLocationAdded: {
        directiveLocationAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveLocationRemoved: {
        directiveLocationRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.EnumValueAdded: {
        enumValueAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.EnumValueDeprecationReasonAdded: {
        enumValueDeprecationReasonAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.EnumValueDeprecationReasonChanged: {
        enumValueDeprecationReasonChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldAdded: {
        fieldAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldRemoved: {
        fieldRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldTypeChanged: {
        fieldTypeChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldArgumentAdded: {
        fieldArgumentAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldArgumentTypeChanged: {
        fieldArgumentTypeChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldArgumentRemoved: {
        fieldArgumentRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldArgumentDescriptionChanged: {
        fieldArgumentDescriptionChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldArgumentDefaultChanged: {
        fieldArgumentDefaultChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldDeprecationAdded: {
        fieldDeprecationAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldDeprecationRemoved: {
        fieldDeprecationRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldDeprecationReasonAdded: {
        fieldDeprecationReasonAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldDeprecationReasonChanged: {
        fieldDeprecationReasonChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldDescriptionAdded: {
        fieldDescriptionAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldDescriptionChanged: {
        fieldDescriptionChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.InputFieldAdded: {
        inputFieldAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.InputFieldRemoved: {
        inputFieldRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.InputFieldDescriptionAdded: {
        inputFieldDescriptionAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.InputFieldTypeChanged: {
        inputFieldTypeChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.InputFieldDescriptionChanged: {
        inputFieldDescriptionChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.InputFieldDescriptionRemoved: {
        inputFieldDescriptionRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.InputFieldDefaultValueChanged: {
        inputFieldDefaultValueChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.ObjectTypeInterfaceAdded: {
        objectTypeInterfaceAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.ObjectTypeInterfaceRemoved: {
        objectTypeInterfaceRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.TypeDescriptionAdded: {
        typeDescriptionAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.TypeDescriptionChanged: {
        typeDescriptionChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.TypeDescriptionRemoved: {
        typeDescriptionRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.TypeAdded: {
        typeAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.UnionMemberAdded: {
        unionMemberAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.UnionMemberRemoved: {
        unionMemberRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.TypeRemoved: {
        typeRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.EnumValueRemoved: {
        enumValueRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.EnumValueDescriptionChanged: {
        enumValueDescriptionChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.FieldDescriptionRemoved: {
        fieldDescriptionRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveArgumentDefaultValueChanged: {
        directiveArgumentDefaultValueChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveArgumentDescriptionChanged: {
        directiveArgumentDescriptionChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveArgumentTypeChanged: {
        directiveArgumentTypeChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveDescriptionChanged: {
        directiveDescriptionChanged(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageArgumentDefinitionAdded: {
        directiveUsageArgumentDefinitionAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageArgumentDefinitionRemoved: {
        directiveUsageArgumentDefinitionRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageEnumAdded: {
        directiveUsageEnumAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageEnumRemoved: {
        directiveUsageEnumRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageEnumValueAdded: {
        directiveUsageEnumValueAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageEnumValueRemoved: {
        directiveUsageEnumValueRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageFieldAdded: {
        directiveUsageFieldAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageFieldDefinitionAdded: {
        directiveUsageFieldDefinitionAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageFieldDefinitionRemoved: {
        directiveUsageFieldDefinitionRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageFieldRemoved: {
        directiveUsageFieldRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageInputFieldDefinitionAdded: {
        directiveUsageInputFieldDefinitionAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageInputFieldDefinitionRemoved: {
        directiveUsageInputFieldDefinitionRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageInputObjectAdded: {
        directiveUsageInputObjectAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageInputObjectRemoved: {
        directiveUsageInputObjectRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageInterfaceAdded: {
        directiveUsageInterfaceAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageInterfaceRemoved: {
        directiveUsageInterfaceRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageObjectAdded: {
        directiveUsageObjectAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageObjectRemoved: {
        directiveUsageObjectRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageScalarAdded: {
        directiveUsageScalarAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageScalarRemoved: {
        directiveUsageScalarRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageSchemaAdded: {
        directiveUsageSchemaAdded(change, schemaDefs, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageSchemaRemoved: {
        directiveUsageSchemaRemoved(change, schemaDefs, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageUnionMemberAdded: {
        directiveUsageUnionMemberAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageUnionMemberRemoved: {
        directiveUsageUnionMemberRemoved(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageArgumentAdded: {
        directiveUsageArgumentAdded(change, nodeByPath, config);
        break;
      }
      case ChangeType.DirectiveUsageArgumentRemoved: {
        directiveUsageArgumentRemoved(change, nodeByPath, config);
        break;
      }
      default: {
        console.log(`${change.type} is not implemented yet.`);
      }
    }
  }

  return {
    kind: Kind.DOCUMENT,
    // filter out the non-definition nodes (e.g. field definitions)
    definitions: [...schemaDefs, ...Array.from(nodeByPath.values()).filter(isDefinitionNode)],
  };
}
