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
  return `Schema query root has changed from '${args.oldQueryTypeName}' to '${args.newQueryTypeName}'`;
}

export function schemaQueryTypeChangedFromMeta(args: SchemaQueryTypeChangedChange) {
  return {
    type: ChangeType.SchemaQueryTypeChanged,
    criticality: {
      level: args.meta.oldQueryTypeName === 'unknown' ? CriticalityLevel.NonBreaking : CriticalityLevel.Breaking,
    },
    message: buildSchemaQueryTypeChangedMessage(args.meta),
    meta: args.meta,
  } as const;
}

export function schemaQueryTypeChanged(
  oldSchema: GraphQLSchema,
  newSchema: GraphQLSchema,
): Change<typeof ChangeType.SchemaQueryTypeChanged> {
  const oldName = (oldSchema.getQueryType() || ({} as any)).name || 'unknown';
  const newName = (newSchema.getQueryType() || ({} as any)).name || 'unknown';

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
  return `Schema mutation root has changed from '${args.oldMutationTypeName}' to '${args.newMutationTypeName}'`;
}

export function schemaMutationTypeChangedFromMeta(args: SchemaMutationTypeChangedChange) {
  return {
    type: ChangeType.SchemaMutationTypeChanged,
    criticality: {
      level: args.meta.oldMutationTypeName === 'unknown' ? CriticalityLevel.NonBreaking : CriticalityLevel.Breaking,
    },
    message: buildSchemaMutationTypeChangedMessage(args.meta),
    meta: args.meta,
  } as const;
}

export function schemaMutationTypeChanged(
  oldSchema: GraphQLSchema,
  newSchema: GraphQLSchema,
): Change<typeof ChangeType.SchemaMutationTypeChanged> {
  const oldName = (oldSchema.getMutationType() || ({} as any)).name || 'unknown';
  const newName = (newSchema.getMutationType() || ({} as any)).name || 'unknown';

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
  return `Schema subscription root has changed from '${args.oldSubscriptionTypeName}' to '${args.newSubscriptionTypeName}'`;
}

export function schemaSubscriptionTypeChangedFromMeta(args: SchemaSubscriptionTypeChangedChange) {
  return {
    type: ChangeType.SchemaSubscriptionTypeChanged,
    criticality: {
      level: args.meta.oldSubscriptionTypeName === 'unknown' ? CriticalityLevel.NonBreaking : CriticalityLevel.Breaking,
    },
    message: buildSchemaSubscriptionTypeChangedMessage(args.meta),
    meta: args.meta,
  } as const;
}

export function schemaSubscriptionTypeChanged(
  oldSchema: GraphQLSchema,
  newSchema: GraphQLSchema,
): Change<typeof ChangeType.SchemaSubscriptionTypeChanged> {
  const oldName = (oldSchema.getSubscriptionType() || ({} as any)).name || 'unknown';
  const newName = (newSchema.getSubscriptionType() || ({} as any)).name || 'unknown';

  return schemaSubscriptionTypeChangedFromMeta({
    type: ChangeType.SchemaSubscriptionTypeChanged,
    meta: {
      newSubscriptionTypeName: newName,
      oldSubscriptionTypeName: oldName,
    },
  });
}
