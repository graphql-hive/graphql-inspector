import { GraphQLSchema } from 'graphql';
import {
  Change,
  ChangeType,
  CriticalityLevel,
  SchemaMutationTypeChangedChange,
  SchemaQueryTypeChangedChange,
  SchemaSubscriptionTypeChangedChange,
} from './change.js';

function buildSchemaQueryTypeChangedMessage(args: SchemaQueryTypeChangedChange['meta']): string {
  if (args.oldQueryTypeName === null) {
    return `Schema query root type was set to '${args.newQueryTypeName}'.`;
  }
  if (args.newQueryTypeName === null) {
    return `Schema query root type '${args.oldQueryTypeName}' was removed.`;
  }
  return `Schema query root type was changed from '${args.oldQueryTypeName}' to '${args.newQueryTypeName}'`;
}

export function schemaQueryTypeChangedFromMeta(args: SchemaQueryTypeChangedChange) {
  return {
    type: ChangeType.SchemaQueryTypeChanged,
    criticality: {
      level:
        args.meta.oldQueryTypeName === null
          ? CriticalityLevel.NonBreaking
          : CriticalityLevel.Breaking,
    },
    message: buildSchemaQueryTypeChangedMessage(args.meta),
    meta: args.meta,
  } as const;
}

export function schemaQueryTypeChanged(
  oldSchema: GraphQLSchema | null,
  newSchema: GraphQLSchema | null,
): Change<typeof ChangeType.SchemaQueryTypeChanged> {
  const oldName = oldSchema?.getQueryType()?.name || null;
  const newName = newSchema?.getQueryType()?.name || null;

  return schemaQueryTypeChangedFromMeta({
    type: ChangeType.SchemaQueryTypeChanged,
    meta: {
      oldQueryTypeName: oldName,
      newQueryTypeName: newName,
    },
  });
}

function buildSchemaMutationTypeChangedMessage(
  args: SchemaMutationTypeChangedChange['meta'],
): string {
  if (args.oldMutationTypeName === null) {
    return `Schema mutation type was set to '${args.newMutationTypeName}'.`;
  }
  if (args.newMutationTypeName === null) {
    return `Schema mutation type '${args.oldMutationTypeName}' was removed.`;
  }
  return `Schema mutation type was changed from '${args.oldMutationTypeName}' to '${args.newMutationTypeName}'`;
}

export function schemaMutationTypeChangedFromMeta(args: SchemaMutationTypeChangedChange) {
  return {
    type: ChangeType.SchemaMutationTypeChanged,
    criticality: {
      level:
        args.meta.oldMutationTypeName === null
          ? CriticalityLevel.NonBreaking
          : CriticalityLevel.Breaking,
    },
    message: buildSchemaMutationTypeChangedMessage(args.meta),
    meta: args.meta,
  } as const;
}

export function schemaMutationTypeChanged(
  oldSchema: GraphQLSchema | null,
  newSchema: GraphQLSchema | null,
): Change<typeof ChangeType.SchemaMutationTypeChanged> {
  const oldName = oldSchema?.getMutationType()?.name || null;
  const newName = newSchema?.getMutationType()?.name || null;

  return schemaMutationTypeChangedFromMeta({
    type: ChangeType.SchemaMutationTypeChanged,
    meta: {
      newMutationTypeName: newName,
      oldMutationTypeName: oldName,
    },
  });
}

function buildSchemaSubscriptionTypeChangedMessage(
  args: SchemaSubscriptionTypeChangedChange['meta'],
): string {
  if (args.oldSubscriptionTypeName === null) {
    return `Schema subscription type was set to '${args.newSubscriptionTypeName}'.`;
  }
  if (args.newSubscriptionTypeName === null) {
    return `Schema subscription type '${args.oldSubscriptionTypeName}' was removed.`;
  }
  return `Schema subscription type was changed from '${args.oldSubscriptionTypeName}' to '${args.newSubscriptionTypeName}'`;
}

export function schemaSubscriptionTypeChangedFromMeta(args: SchemaSubscriptionTypeChangedChange) {
  return {
    type: ChangeType.SchemaSubscriptionTypeChanged,
    criticality: {
      level:
        args.meta.oldSubscriptionTypeName === null
          ? CriticalityLevel.NonBreaking
          : CriticalityLevel.Breaking,
    },
    message: buildSchemaSubscriptionTypeChangedMessage(args.meta),
    meta: args.meta,
  } as const;
}

export function schemaSubscriptionTypeChanged(
  oldSchema: GraphQLSchema | null,
  newSchema: GraphQLSchema | null,
): Change<typeof ChangeType.SchemaSubscriptionTypeChanged> {
  const oldName = oldSchema?.getSubscriptionType()?.name || null;
  const newName = newSchema?.getSubscriptionType()?.name || null;

  return schemaSubscriptionTypeChangedFromMeta({
    type: ChangeType.SchemaSubscriptionTypeChanged,
    meta: {
      newSubscriptionTypeName: newName,
      oldSubscriptionTypeName: oldName,
    },
  });
}
