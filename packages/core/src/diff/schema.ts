import {
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLSchema,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
  Kind,
} from 'graphql';
import { compareLists, isNotEqual, isVoid } from '../utils/compare.js';
import { isPrimitive } from '../utils/graphql.js';
import { Change } from './changes/change.js';
import { directiveUsageAdded, directiveUsageRemoved } from './changes/directive-usage.js';
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

export function diffSchema(oldSchema: GraphQLSchema, newSchema: GraphQLSchema): Change[] {
  const changes: Change[] = [];

  function addChange(change: Change) {
    changes.push(change);
  }

  changesInSchema(oldSchema, newSchema, addChange);

  compareLists(
    Object.values(oldSchema.getTypeMap()).filter(t => !isPrimitive(t)),
    Object.values(newSchema.getTypeMap()).filter(t => !isPrimitive(t)),
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

  compareLists(oldSchema.getDirectives(), newSchema.getDirectives(), {
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
  });

  compareLists(oldSchema.astNode?.directives || [], newSchema.astNode?.directives || [], {
    onAdded(directive) {
      addChange(directiveUsageAdded(Kind.SCHEMA_DEFINITION, directive, newSchema, false));
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.SCHEMA_DEFINITION, directive, oldSchema));
    },
  });

  return changes;
}

function changesInSchema(oldSchema: GraphQLSchema, newSchema: GraphQLSchema, addChange: AddChange) {
  const defaultNames = {
    query: 'Query',
    mutation: 'Mutation',
    subscription: 'Subscription',
  };
  const oldRoot = {
    query: (oldSchema.getQueryType() || ({} as GraphQLObjectType)).name ?? defaultNames.query,
    mutation:
      (oldSchema.getMutationType() || ({} as GraphQLObjectType)).name ?? defaultNames.mutation,
    subscription:
      (oldSchema.getSubscriptionType() || ({} as GraphQLObjectType)).name ??
      defaultNames.subscription,
  };
  const newRoot = {
    query: (newSchema.getQueryType() || ({} as GraphQLObjectType)).name ?? defaultNames.query,
    mutation:
      (newSchema.getMutationType() || ({} as GraphQLObjectType)).name ?? defaultNames.mutation,
    subscription:
      (newSchema.getSubscriptionType() || ({} as GraphQLObjectType)).name ??
      defaultNames.subscription,
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
  if ((oldType === null || isEnumType(oldType)) && isEnumType(newType)) {
    changesInEnum(oldType, newType, addChange);
  } else if ((oldType === null || isUnionType(oldType)) && isUnionType(newType)) {
    changesInUnion(oldType, newType, addChange);
  } else if ((oldType === null || isInputObjectType(oldType)) && isInputObjectType(newType)) {
    changesInInputObject(oldType, newType, addChange);
  } else if ((oldType === null || isObjectType(oldType)) && isObjectType(newType)) {
    changesInObject(oldType, newType, addChange);
  } else if ((oldType === null || isInterfaceType(oldType)) && isInterfaceType(newType)) {
    changesInInterface(oldType, newType, addChange);
  } else if ((oldType === null || isScalarType(oldType)) && isScalarType(newType)) {
    changesInScalar(oldType, newType, addChange);
  } else {
    addChange(typeKindChanged(oldType, newType));
  }

  if (isNotEqual(oldType?.description, newType.description)) {
    if (isVoid(oldType?.description)) {
      addChange(typeDescriptionAdded(newType));
    } else if (oldType && isVoid(newType.description)) {
      addChange(typeDescriptionRemoved(oldType));
    } else {
      addChange(typeDescriptionChanged(oldType!, newType));
    }
  }
}
