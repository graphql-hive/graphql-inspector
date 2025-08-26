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

/**
 * Wraps converting a schema to AST safely, patching, then rebuilding the schema from AST.
 */
export function patchSchema(
  schema: GraphQLSchema,
  changes: Change<any>[],
  config?: PatchConfig,
): GraphQLSchema {
  const ast = parse(printSchemaWithDirectives(schema, { assumeValid: true }));
  const patchedAst = patch(ast, changes, config);
  return buildASTSchema(patchedAst, { assumeValid: true, assumeValidSDL: true });
}

/**
 * Extracts all the root definitions from a DocumentNode and creates a mapping of their coordinate
 * to the defined ASTNode. E.g. A field's coordinate is "Type.field".
 */
export function groupByCoordinateAST(ast: DocumentNode): [SchemaNode[], Map<string, ASTNode>] {
  const schemaNodes: SchemaNode[] = [];
  const nodesByCoordinate = new Map<string, ASTNode>();
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
          nodesByCoordinate.set(path, node);
          break;
        }
        case Kind.DIRECTIVE_DEFINITION: {
          pathArray.push(`@${node.name.value}`);
          const path = pathArray.join('.');
          nodesByCoordinate.set(path, node);
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
          nodesByCoordinate.set(path, node);
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
  return [schemaNodes, nodesByCoordinate];
}

export function patchCoordinatesAST(
  schemaNodes: SchemaNode[],
  nodesByCoordinate: Map<string, ASTNode>,
  changes: Change<any>[],
  patchConfig?: PatchConfig,
): DocumentNode {
  const config: PatchConfig = patchConfig ?? {};

  for (const change of changes) {
    if (config.debug) {
      debugPrintChange(change, nodesByCoordinate);
    }

    switch (change.type) {
      case ChangeType.SchemaMutationTypeChanged: {
        schemaMutationTypeChanged(change, schemaNodes, config);
        break;
      }
      case ChangeType.SchemaQueryTypeChanged: {
        schemaQueryTypeChanged(change, schemaNodes, config);
        break;
      }
      case ChangeType.SchemaSubscriptionTypeChanged: {
        schemaSubscriptionTypeChanged(change, schemaNodes, config);
        break;
      }
      case ChangeType.DirectiveAdded: {
        directiveAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveRemoved: {
        directiveRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveArgumentAdded: {
        directiveArgumentAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveArgumentRemoved: {
        directiveArgumentRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveLocationAdded: {
        directiveLocationAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveLocationRemoved: {
        directiveLocationRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.EnumValueAdded: {
        enumValueAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.EnumValueDeprecationReasonAdded: {
        enumValueDeprecationReasonAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.EnumValueDeprecationReasonChanged: {
        enumValueDeprecationReasonChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldAdded: {
        fieldAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldRemoved: {
        fieldRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldTypeChanged: {
        fieldTypeChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldArgumentAdded: {
        fieldArgumentAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldArgumentTypeChanged: {
        fieldArgumentTypeChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldArgumentRemoved: {
        fieldArgumentRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldArgumentDescriptionChanged: {
        fieldArgumentDescriptionChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldArgumentDefaultChanged: {
        fieldArgumentDefaultChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldDeprecationAdded: {
        fieldDeprecationAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldDeprecationRemoved: {
        fieldDeprecationRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldDeprecationReasonAdded: {
        fieldDeprecationReasonAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldDeprecationReasonChanged: {
        fieldDeprecationReasonChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldDescriptionAdded: {
        fieldDescriptionAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldDescriptionChanged: {
        fieldDescriptionChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.InputFieldAdded: {
        inputFieldAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.InputFieldRemoved: {
        inputFieldRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.InputFieldDescriptionAdded: {
        inputFieldDescriptionAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.InputFieldTypeChanged: {
        inputFieldTypeChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.InputFieldDescriptionChanged: {
        inputFieldDescriptionChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.InputFieldDescriptionRemoved: {
        inputFieldDescriptionRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.InputFieldDefaultValueChanged: {
        inputFieldDefaultValueChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.ObjectTypeInterfaceAdded: {
        objectTypeInterfaceAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.ObjectTypeInterfaceRemoved: {
        objectTypeInterfaceRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.TypeDescriptionAdded: {
        typeDescriptionAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.TypeDescriptionChanged: {
        typeDescriptionChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.TypeDescriptionRemoved: {
        typeDescriptionRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.TypeAdded: {
        typeAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.UnionMemberAdded: {
        unionMemberAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.UnionMemberRemoved: {
        unionMemberRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.TypeRemoved: {
        typeRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.EnumValueRemoved: {
        enumValueRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.EnumValueDescriptionChanged: {
        enumValueDescriptionChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.FieldDescriptionRemoved: {
        fieldDescriptionRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveArgumentDefaultValueChanged: {
        directiveArgumentDefaultValueChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveArgumentDescriptionChanged: {
        directiveArgumentDescriptionChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveArgumentTypeChanged: {
        directiveArgumentTypeChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveDescriptionChanged: {
        directiveDescriptionChanged(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageArgumentDefinitionAdded: {
        directiveUsageArgumentDefinitionAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageArgumentDefinitionRemoved: {
        directiveUsageArgumentDefinitionRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageEnumAdded: {
        directiveUsageEnumAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageEnumRemoved: {
        directiveUsageEnumRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageEnumValueAdded: {
        directiveUsageEnumValueAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageEnumValueRemoved: {
        directiveUsageEnumValueRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageFieldAdded: {
        directiveUsageFieldAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageFieldDefinitionAdded: {
        directiveUsageFieldDefinitionAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageFieldDefinitionRemoved: {
        directiveUsageFieldDefinitionRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageFieldRemoved: {
        directiveUsageFieldRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageInputFieldDefinitionAdded: {
        directiveUsageInputFieldDefinitionAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageInputFieldDefinitionRemoved: {
        directiveUsageInputFieldDefinitionRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageInputObjectAdded: {
        directiveUsageInputObjectAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageInputObjectRemoved: {
        directiveUsageInputObjectRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageInterfaceAdded: {
        directiveUsageInterfaceAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageInterfaceRemoved: {
        directiveUsageInterfaceRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageObjectAdded: {
        directiveUsageObjectAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageObjectRemoved: {
        directiveUsageObjectRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageScalarAdded: {
        directiveUsageScalarAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageScalarRemoved: {
        directiveUsageScalarRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageSchemaAdded: {
        directiveUsageSchemaAdded(change, schemaNodes, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageSchemaRemoved: {
        directiveUsageSchemaRemoved(change, schemaNodes, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageUnionMemberAdded: {
        directiveUsageUnionMemberAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageUnionMemberRemoved: {
        directiveUsageUnionMemberRemoved(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageArgumentAdded: {
        directiveUsageArgumentAdded(change, nodesByCoordinate, config);
        break;
      }
      case ChangeType.DirectiveUsageArgumentRemoved: {
        directiveUsageArgumentRemoved(change, nodesByCoordinate, config);
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
    definitions: [
      ...schemaNodes,
      ...Array.from(nodesByCoordinate.values()).filter(isDefinitionNode),
    ],
  };
}

/** This method wraps groupByCoordinateAST and patchCoordinatesAST for convenience. */
export function patch(
  ast: DocumentNode,
  changes: Change<any>[],
  patchConfig?: PatchConfig,
): DocumentNode {
  const [schemaNodes, nodesByCoordinate] = groupByCoordinateAST(ast);
  return patchCoordinatesAST(schemaNodes, nodesByCoordinate, changes, patchConfig);
}
