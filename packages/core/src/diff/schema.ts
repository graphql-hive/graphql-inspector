import {
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLSchema,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isSpecifiedDirective,
  isUnionType,
  Kind,
} from 'graphql';
import { compareDirectiveLists, compareLists, isNotEqual, isVoid } from '../utils/compare.js';
import type { DirectiveUsageNodes } from '../utils/compare.js';
import { isForIntrospection, isPrimitive } from '../utils/graphql.js';
import { Change } from './changes/change.js';
import {
  directiveUsageAdded,
  directiveUsageChanged,
  directiveUsageRemoved,
} from './changes/directive-usage.js';
import { directiveAdded, directiveRemoved } from './changes/directive.js';
import {
  schemaMutationTypeChanged,
  schemaQueryTypeChanged,
  schemaSubscriptionTypeChanged,
} from './changes/schema.js';
import {
  typeAdded,
  typeDescriptionAdded,
  typeDescriptionChanged,
  typeDescriptionRemoved,
  typeKindChanged,
  typeRemoved,
} from './changes/type.js';
import { changesInDirective } from './directive.js';
import { changesInEnum } from './enum.js';
import { changesInInputObject } from './input.js';
import { changesInInterface } from './interface.js';
import { changesInObject } from './object.js';
import { changesInScalar } from './scalar.js';
import { changesInUnion } from './union.js';

export type AddChange = (change: Change) => void;

export type SkipDirectiveUsages = (params: DirectiveUsageNodes & { path: string }) => void;

export interface DiffWarning {
  message: string;
  paths: string[];
}

export interface DiffOptions {
  onWarning?: (warning: DiffWarning) => void;
}

export function diffSchema(
  oldSchema: GraphQLSchema | null,
  newSchema: GraphQLSchema | null,
  options: DiffOptions = {},
): Change[] {
  const changes: Change[] = [];
  const skippedDirectiveUsagePaths: string[] = [];

  function addChange(change: Change) {
    changes.push(change);
  }

  // Only mixed comparisons are recorded: both sides exist and exactly one has an AST node.
  // - old has AST, new has none -> recorded
  // - old has none, new has AST -> recorded
  // - neither has AST (e.g. two introspection-built schemas) -> silent
  // - old is null (node added) -> silent
  function skipDirectiveUsages({
    path,
    oldNode,
    newNode,
  }: DirectiveUsageNodes & { path: string }): void {
    if (oldNode && !!oldNode.astNode !== !!newNode.astNode) {
      skippedDirectiveUsagePaths.push(path);
    }
  }

  // A schema built from SDL has AST nodes on its types even without a schema definition.
  function hasAst(schema: GraphQLSchema): boolean {
    return (
      !!schema.astNode ||
      schema.extensionASTNodes.length > 0 ||
      Object.values(schema.getTypeMap()).some(type => !!type.astNode)
    );
  }

  // important for directives to come first so that any directive usages that come
  // later are able to find the directive definitions that were added.
  compareLists(
    (oldSchema?.getDirectives() ?? []).filter(t => !isSpecifiedDirective(t)),
    (newSchema?.getDirectives() ?? []).filter(t => !isSpecifiedDirective(t)),
    {
      onAdded(directive) {
        addChange(directiveAdded(directive));
        changesInDirective(null, directive, addChange);
      },
      onRemoved(directive) {
        addChange(directiveRemoved(directive));
      },
      onMutual(directive) {
        changesInDirective(directive.oldVersion, directive.newVersion, addChange);
      },
    },
  );

  changesInSchema(oldSchema, newSchema, addChange);

  compareLists(
    Object.values(oldSchema?.getTypeMap() ?? {}).filter(
      t => !isPrimitive(t) && !isForIntrospection(t),
    ),
    Object.values(newSchema?.getTypeMap() ?? {}).filter(
      t => !isPrimitive(t) && !isForIntrospection(t),
    ),
    {
      onAdded(type) {
        addChange(typeAdded(type));
        changesInType(null, type, addChange, skipDirectiveUsages);
      },
      onRemoved(type) {
        addChange(typeRemoved(type));
      },
      onMutual(type) {
        changesInType(type.oldVersion, type.newVersion, addChange, skipDirectiveUsages);
      },
    },
  );

  if (oldSchema && newSchema && (!hasAst(oldSchema) || !hasAst(newSchema))) {
    if (hasAst(oldSchema) !== hasAst(newSchema)) {
      skippedDirectiveUsagePaths.push('schema');
    }
  } else {
    compareDirectiveLists(
      oldSchema?.astNode?.directives || [],
      newSchema?.astNode?.directives || [],
      {
        onAdded(directive) {
          addChange(directiveUsageAdded(Kind.SCHEMA_DEFINITION, directive, newSchema, false));
          directiveUsageChanged(null, directive, addChange);
        },
        onMutual(directive) {
          directiveUsageChanged(directive.oldVersion, directive.newVersion, addChange);
        },
        onRemoved(directive) {
          addChange(directiveUsageRemoved(Kind.SCHEMA_DEFINITION, directive, oldSchema));
        },
      },
    );

    /**
     * Extracting directives from the schema definition requires using the AST. But the AST does not combine the
     * definition and extensions like the GraphQL Type System. Therefore, the extensions must be looped over as well.
     **/
    for (
      let e = 0;
      e <
      Math.max(oldSchema?.extensionASTNodes.length ?? 0, newSchema?.extensionASTNodes.length ?? 0);
      e++
    ) {
      compareDirectiveLists(
        oldSchema?.extensionASTNodes[e]?.directives || [],
        newSchema?.extensionASTNodes[e]?.directives || [],
        {
          onAdded(directive) {
            addChange(directiveUsageAdded(Kind.SCHEMA_DEFINITION, directive, newSchema, false));
            directiveUsageChanged(null, directive, addChange);
          },
          onMutual(directive) {
            directiveUsageChanged(directive.oldVersion, directive.newVersion, addChange);
          },
          onRemoved(directive) {
            addChange(directiveUsageRemoved(Kind.SCHEMA_DEFINITION, directive, oldSchema));
          },
        },
      );
    }
  }

  if (options.onWarning && skippedDirectiveUsagePaths.length > 0) {
    options.onWarning({
      message: `Directive usages were not compared for ${skippedDirectiveUsagePaths.length} paths because a schema has no AST (e.g. it was built from introspection)`,
      paths: skippedDirectiveUsagePaths,
    });
  }

  return changes;
}

function changesInSchema(
  oldSchema: GraphQLSchema | null,
  newSchema: GraphQLSchema | null,
  addChange: AddChange,
) {
  const oldRoot = {
    query: (oldSchema?.getQueryType() || ({} as GraphQLObjectType)).name,
    mutation: (oldSchema?.getMutationType() || ({} as GraphQLObjectType)).name,
    subscription: (oldSchema?.getSubscriptionType() || ({} as GraphQLObjectType)).name,
  };
  const newRoot = {
    query: (newSchema?.getQueryType() || ({} as GraphQLObjectType)).name,
    mutation: (newSchema?.getMutationType() || ({} as GraphQLObjectType)).name,
    subscription: (newSchema?.getSubscriptionType() || ({} as GraphQLObjectType)).name,
  };

  if (isNotEqual(oldRoot.query, newRoot.query)) {
    addChange(schemaQueryTypeChanged(oldSchema, newSchema));
  }

  if (isNotEqual(oldRoot.mutation, newRoot.mutation)) {
    addChange(schemaMutationTypeChanged(oldSchema, newSchema));
  }

  if (isNotEqual(oldRoot.subscription, newRoot.subscription)) {
    addChange(schemaSubscriptionTypeChanged(oldSchema, newSchema));
  }
}

function changesInType(
  oldType: GraphQLNamedType | null,
  newType: GraphQLNamedType,
  addChange: AddChange,
  skipDirectiveUsages: SkipDirectiveUsages,
): void {
  if ((isVoid(oldType) || isEnumType(oldType)) && isEnumType(newType)) {
    changesInEnum(oldType, newType, addChange, skipDirectiveUsages);
  } else if ((isVoid(oldType) || isUnionType(oldType)) && isUnionType(newType)) {
    changesInUnion(oldType, newType, addChange, skipDirectiveUsages);
  } else if ((isVoid(oldType) || isInputObjectType(oldType)) && isInputObjectType(newType)) {
    changesInInputObject(oldType, newType, addChange, skipDirectiveUsages);
  } else if ((isVoid(oldType) || isObjectType(oldType)) && isObjectType(newType)) {
    changesInObject(oldType, newType, addChange, skipDirectiveUsages);
  } else if ((isVoid(oldType) || isInterfaceType(oldType)) && isInterfaceType(newType)) {
    changesInInterface(oldType, newType, addChange, skipDirectiveUsages);
  } else if ((isVoid(oldType) || isScalarType(oldType)) && isScalarType(newType)) {
    changesInScalar(oldType, newType, addChange, skipDirectiveUsages);
  } else if (!isVoid(oldType)) {
    // no need to call if oldType is void since the type will be captured by the TypeAdded change.
    addChange(typeKindChanged(oldType, newType));
  }

  if (isNotEqual(oldType?.description, newType.description)) {
    if (isVoid(oldType?.description)) {
      addChange(typeDescriptionAdded(newType));
    } else if (oldType.description && isVoid(newType.description)) {
      addChange(typeDescriptionRemoved(oldType));
    } else {
      addChange(typeDescriptionChanged(oldType, newType));
    }
  }
}
