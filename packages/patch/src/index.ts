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
import { defaultErrorHandler } from './errors.js';
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
  directiveRepeatableAdded,
  directiveRepeatableRemoved,
} from './patches/directives.js';
import { enumValueAdded, enumValueDescriptionChanged, enumValueRemoved } from './patches/enum.js';
import {
  fieldAdded,
  fieldArgumentAdded,
  fieldArgumentDefaultChanged,
  fieldArgumentDescriptionChanged,
  fieldArgumentRemoved,
  fieldArgumentTypeChanged,
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
import { PatchConfig, PatchContext, SchemaNode } from './types.js';
import { debugPrintChange } from './utils.js';

export * as errors from './errors.js';

/**
 * Wraps converting a schema to AST safely, patching, then rebuilding the schema from AST.
 * The schema is not validated in this function. That it is the responsibility of the caller.
 */
export function patchSchema(
  schema: GraphQLSchema,
  changes: Change<any>[],
  config?: Partial<PatchConfig>,
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
    enter(node, key) {
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
            pathArray.push(`.@${node.name.value}[${key}]`);
          } else {
            pathArray.push(`@${node.name.value}[${key}]`);
          }
          // const path = pathArray.join('.');
          // nodesByCoordinate.set(path, node);
          // @note skip setting the node for directives because repeat directives screw this up.
          break;
        }
        case Kind.DOCUMENT: {
          break;
        }
        case Kind.SCHEMA_EXTENSION:
        case Kind.SCHEMA_DEFINITION: {
          // @todo There can be only one. Replace `schemaNodes` with using `nodesByCoordinate.get('')`.
          schemaNodes.push(node);
          nodesByCoordinate.set('', node);
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
  patchConfig: Partial<PatchConfig> = {},
): DocumentNode {
  const config: PatchConfig = {
    onError: defaultErrorHandler,
    debug: false,
    ...patchConfig,
  };
  const context: PatchContext = {
    removedDirectiveNodes: [],
  };

  for (const change of changes) {
    if (config.debug) {
      debugPrintChange(change, nodesByCoordinate);
    }

    switch (change.type) {
      case ChangeType.SchemaMutationTypeChanged: {
        schemaMutationTypeChanged(change, schemaNodes, config, context);
        break;
      }
      case ChangeType.SchemaQueryTypeChanged: {
        schemaQueryTypeChanged(change, schemaNodes, config, context);
        break;
      }
      case ChangeType.SchemaSubscriptionTypeChanged: {
        schemaSubscriptionTypeChanged(change, schemaNodes, config, context);
        break;
      }
      case ChangeType.DirectiveAdded: {
        directiveAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveRemoved: {
        directiveRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveArgumentAdded: {
        directiveArgumentAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveArgumentRemoved: {
        directiveArgumentRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveLocationAdded: {
        directiveLocationAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveLocationRemoved: {
        directiveLocationRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.EnumValueAdded: {
        enumValueAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.FieldAdded: {
        fieldAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.FieldRemoved: {
        fieldRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.FieldTypeChanged: {
        fieldTypeChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.FieldArgumentAdded: {
        fieldArgumentAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.FieldArgumentTypeChanged: {
        fieldArgumentTypeChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.FieldArgumentRemoved: {
        fieldArgumentRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.FieldArgumentDescriptionChanged: {
        fieldArgumentDescriptionChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.FieldArgumentDefaultChanged: {
        fieldArgumentDefaultChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.FieldDescriptionAdded: {
        fieldDescriptionAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.FieldDescriptionChanged: {
        fieldDescriptionChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.InputFieldAdded: {
        inputFieldAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.InputFieldRemoved: {
        inputFieldRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.InputFieldDescriptionAdded: {
        inputFieldDescriptionAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.InputFieldTypeChanged: {
        inputFieldTypeChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.InputFieldDescriptionChanged: {
        inputFieldDescriptionChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.InputFieldDescriptionRemoved: {
        inputFieldDescriptionRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.InputFieldDefaultValueChanged: {
        inputFieldDefaultValueChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.ObjectTypeInterfaceAdded: {
        objectTypeInterfaceAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.ObjectTypeInterfaceRemoved: {
        objectTypeInterfaceRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.TypeDescriptionAdded: {
        typeDescriptionAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.TypeDescriptionChanged: {
        typeDescriptionChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.TypeDescriptionRemoved: {
        typeDescriptionRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.TypeAdded: {
        typeAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.UnionMemberAdded: {
        unionMemberAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.UnionMemberRemoved: {
        unionMemberRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.TypeRemoved: {
        typeRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.EnumValueRemoved: {
        enumValueRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.EnumValueDescriptionChanged: {
        enumValueDescriptionChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.FieldDescriptionRemoved: {
        fieldDescriptionRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveArgumentDefaultValueChanged: {
        directiveArgumentDefaultValueChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveArgumentDescriptionChanged: {
        directiveArgumentDescriptionChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveArgumentTypeChanged: {
        directiveArgumentTypeChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveDescriptionChanged: {
        directiveDescriptionChanged(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveRepeatableAdded: {
        directiveRepeatableAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveRepeatableRemoved: {
        directiveRepeatableRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageArgumentDefinitionAdded: {
        directiveUsageArgumentDefinitionAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageArgumentDefinitionRemoved: {
        directiveUsageArgumentDefinitionRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageEnumAdded: {
        directiveUsageEnumAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageEnumRemoved: {
        directiveUsageEnumRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageEnumValueAdded: {
        directiveUsageEnumValueAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageEnumValueRemoved: {
        directiveUsageEnumValueRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageFieldAdded: {
        directiveUsageFieldAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageFieldDefinitionAdded: {
        directiveUsageFieldDefinitionAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageFieldDefinitionRemoved: {
        directiveUsageFieldDefinitionRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageFieldRemoved: {
        directiveUsageFieldRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageInputFieldDefinitionAdded: {
        directiveUsageInputFieldDefinitionAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageInputFieldDefinitionRemoved: {
        directiveUsageInputFieldDefinitionRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageInputObjectAdded: {
        directiveUsageInputObjectAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageInputObjectRemoved: {
        directiveUsageInputObjectRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageInterfaceAdded: {
        directiveUsageInterfaceAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageInterfaceRemoved: {
        directiveUsageInterfaceRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageObjectAdded: {
        directiveUsageObjectAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageObjectRemoved: {
        directiveUsageObjectRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageScalarAdded: {
        directiveUsageScalarAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageScalarRemoved: {
        directiveUsageScalarRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageSchemaAdded: {
        directiveUsageSchemaAdded(change, schemaNodes, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageSchemaRemoved: {
        directiveUsageSchemaRemoved(change, schemaNodes, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageUnionMemberAdded: {
        directiveUsageUnionMemberAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageUnionMemberRemoved: {
        directiveUsageUnionMemberRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageArgumentAdded: {
        directiveUsageArgumentAdded(change, nodesByCoordinate, config, context);
        break;
      }
      case ChangeType.DirectiveUsageArgumentRemoved: {
        directiveUsageArgumentRemoved(change, nodesByCoordinate, config, context);
        break;
      }
      default: {
        console.log(`${change.type} is not implemented yet.`);
      }
    }
  }

  for (const node of context.removedDirectiveNodes) {
    node.directives = node.directives?.filter(d => d != null);
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
  patchConfig?: Partial<PatchConfig>,
): DocumentNode {
  const [schemaNodes, nodesByCoordinate] = groupByCoordinateAST(ast);
  return patchCoordinatesAST(schemaNodes, nodesByCoordinate, changes, patchConfig);
}
