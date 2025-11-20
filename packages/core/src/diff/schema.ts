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

export function diffSchema(
  oldSchema: GraphQLSchema | null,
  newSchema: GraphQLSchema | null,
): Change[] {
  const changes: Change[] = [];

  function addChange(change: Change) {
    changes.push(change);
  }

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
        changesInType(null, type, addChange);
      },
      onRemoved(type) {
        addChange(typeRemoved(type));
      },
      onMutual(type) {
        changesInType(type.oldVersion, type.newVersion, addChange);
      },
    },
  );

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
) {
  if ((isVoid(oldType) || isEnumType(oldType)) && isEnumType(newType)) {
    changesInEnum(oldType, newType, addChange);
  } else if ((isVoid(oldType) || isUnionType(oldType)) && isUnionType(newType)) {
    changesInUnion(oldType, newType, addChange);
  } else if ((isVoid(oldType) || isInputObjectType(oldType)) && isInputObjectType(newType)) {
    changesInInputObject(oldType, newType, addChange);
  } else if ((isVoid(oldType) || isObjectType(oldType)) && isObjectType(newType)) {
    changesInObject(oldType, newType, addChange);
  } else if ((isVoid(oldType) || isInterfaceType(oldType)) && isInterfaceType(newType)) {
    changesInInterface(oldType, newType, addChange);
  } else if ((isVoid(oldType) || isScalarType(oldType)) && isScalarType(newType)) {
    changesInScalar(oldType, newType, addChange);
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
