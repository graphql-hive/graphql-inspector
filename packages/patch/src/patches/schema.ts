/* eslint-disable unicorn/no-negated-condition */
import { Kind, NameNode, OperationTypeDefinitionNode, OperationTypeNode } from 'graphql';
import type { Change, ChangeType } from '@graphql-inspector/core';
import { ValueMismatchError } from '../errors.js';
import { nameNode } from '../node-templates.js';
import { PatchConfig, PatchContext, SchemaNode } from '../types.js';

export function schemaMutationTypeChanged(
  change: Change<typeof ChangeType.SchemaMutationTypeChanged>,
  schemaNodes: SchemaNode[],
  config: PatchConfig,
  _context: PatchContext,
) {
  for (const schemaNode of schemaNodes) {
    const mutation = schemaNode.operationTypes?.find(
      ({ operation }) => operation === OperationTypeNode.MUTATION,
    );
    if (!mutation) {
      if (change.meta.oldMutationTypeName !== 'unknown') {
        config.onError(
          new ValueMismatchError(
            Kind.SCHEMA_DEFINITION,
            change.meta.oldMutationTypeName,
            'unknown',
          ),
          change,
        );
      }
      (schemaNode.operationTypes as OperationTypeDefinitionNode[]) = [
        ...(schemaNode.operationTypes ?? []),
        {
          kind: Kind.OPERATION_TYPE_DEFINITION,
          operation: OperationTypeNode.MUTATION,
          type: {
            kind: Kind.NAMED_TYPE,
            name: nameNode(change.meta.newMutationTypeName),
          },
        },
      ];
    } else {
      if (mutation.type.name.value !== change.meta.oldMutationTypeName) {
        config.onError(
          new ValueMismatchError(
            Kind.SCHEMA_DEFINITION,
            change.meta.oldMutationTypeName,
            mutation?.type.name.value,
          ),
          change,
        );
      }
      (mutation.type.name as NameNode) = nameNode(change.meta.newMutationTypeName);
    }
  }
}

export function schemaQueryTypeChanged(
  change: Change<typeof ChangeType.SchemaQueryTypeChanged>,
  schemaNodes: SchemaNode[],
  config: PatchConfig,
  _context: PatchContext,
) {
  for (const schemaNode of schemaNodes) {
    const query = schemaNode.operationTypes?.find(
      ({ operation }) => operation === OperationTypeNode.MUTATION,
    );
    if (!query) {
      if (change.meta.oldQueryTypeName !== 'unknown') {
        config.onError(
          new ValueMismatchError(Kind.SCHEMA_DEFINITION, change.meta.oldQueryTypeName, 'unknown'),
          change,
        );
      }
      (schemaNode.operationTypes as OperationTypeDefinitionNode[]) = [
        ...(schemaNode.operationTypes ?? []),
        {
          kind: Kind.OPERATION_TYPE_DEFINITION,
          operation: OperationTypeNode.QUERY,
          type: {
            kind: Kind.NAMED_TYPE,
            name: nameNode(change.meta.newQueryTypeName),
          },
        },
      ];
    } else {
      if (query.type.name.value !== change.meta.oldQueryTypeName) {
        config.onError(
          new ValueMismatchError(
            Kind.SCHEMA_DEFINITION,
            change.meta.oldQueryTypeName,
            query?.type.name.value,
          ),
          change,
        );
      }
      (query.type.name as NameNode) = nameNode(change.meta.newQueryTypeName);
    }
  }
}

export function schemaSubscriptionTypeChanged(
  change: Change<typeof ChangeType.SchemaSubscriptionTypeChanged>,
  schemaNodes: SchemaNode[],
  config: PatchConfig,
  _context: PatchContext,
) {
  for (const schemaNode of schemaNodes) {
    const sub = schemaNode.operationTypes?.find(
      ({ operation }) => operation === OperationTypeNode.SUBSCRIPTION,
    );
    if (!sub) {
      if (change.meta.oldSubscriptionTypeName !== 'unknown') {
        config.onError(
          new ValueMismatchError(
            Kind.SCHEMA_DEFINITION,
            change.meta.oldSubscriptionTypeName,
            'unknown',
          ),
          change,
        );
      }
      (schemaNode.operationTypes as OperationTypeDefinitionNode[]) = [
        ...(schemaNode.operationTypes ?? []),
        {
          kind: Kind.OPERATION_TYPE_DEFINITION,
          operation: OperationTypeNode.QUERY,
          type: {
            kind: Kind.NAMED_TYPE,
            name: nameNode(change.meta.newSubscriptionTypeName),
          },
        },
      ];
    } else {
      if (sub.type.name.value !== change.meta.oldSubscriptionTypeName) {
        config.onError(
          new ValueMismatchError(
            Kind.SCHEMA_DEFINITION,
            change.meta.oldSubscriptionTypeName,
            sub?.type.name.value,
          ),
          change,
        );
      }
      (sub.type.name as NameNode) = nameNode(change.meta.newSubscriptionTypeName);
    }
  }
}
