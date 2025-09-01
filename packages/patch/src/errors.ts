import { Kind } from 'graphql';
import type { Change } from '@graphql-inspector/core';
import type { PatchConfig } from './types.js';

export function handleError(change: Change<any>, err: Error, config: PatchConfig) {
  if (config.onError?.(err, change) === true) {
    // handled by onError
    return;
  }

  if (err instanceof NoopError) {
    console.debug(
      `Ignoring change ${change.type} at "${change.path}" because it does not modify the resulting schema.`,
    );
  } else if (!config.requireOldValueMatch && err instanceof ValueMismatchError) {
    console.debug(`Ignoring old value mismatch at "${change.path}".`);
  } else if (config.throwOnError === true) {
    throw err;
  } else {
    console.warn(`Cannot apply ${change.type} at "${change.path}". ${err.message}`);
  }
}

/**
 * When the change does not actually modify the resulting schema, then it is
 * considered a "no-op". This error can safely be ignored.
 */
export class NoopError extends Error {
  readonly noop = true;
  constructor(message: string) {
    super(`The change resulted in a no op. ${message}`);
  }
}

export class ValueMismatchError extends Error {
  readonly mismatch = true;
  constructor(kind: Kind, expected: string | undefined | null, actual: string | undefined | null) {
    super(
      `The existing value did not match what was expected. Expected the "${kind}" to be ${expected} but found ${actual}.`,
    );
  }
}

/**
 * If the requested change would not modify the schema because that change is effectively
 * already applied.
 *
 * If the added coordinate exists but the kind does not match what's expected, then use
 * ChangedCoordinateKindMismatchError instead.
 */
export class AddedCoordinateAlreadyExistsError extends NoopError {
  constructor(
    public readonly kind: Kind,
    readonly expectedNameOrValue: string | undefined,
  ) {
    const expected = expectedNameOrValue ? `${expectedNameOrValue} ` : '';
    super(`A "${kind}" ${expected}already exists at the schema coordinate.`);
  }
}

export type NodeAttribute =
  | 'description'
  | 'defaultValue'
  /** Enum values */
  | 'values'
  /** Union types */
  | 'types'
  /** Return type */
  | 'type'
  | 'interfaces'
  | 'directives'
  | 'arguments'
  | 'locations'
  | 'fields';

/**
 * If trying to add a node at a path, but that path no longer exists. E.g. add a description to
 * a type, but that type was previously deleted.
 * This differs from AddedCoordinateAlreadyExistsError because
 */
export class AddedAttributeCoordinateNotFoundError extends Error {
  constructor(
    public readonly parentName: string,
    readonly attribute: NodeAttribute,
    readonly attributeValue: string,
  ) {
    super(
      `Cannot add "${attributeValue}" to "${attribute}", because "${parentName}" does not exist.`,
    );
  }
}

/**
 * If trying to manipulate a node at a path, but that path no longer exists. E.g. change a description of
 * a type, but that type was previously deleted.
 */
export class ChangedAncestorCoordinateNotFoundError extends Error {
  constructor(
    public readonly parentKind: Kind,
    readonly attribute: NodeAttribute,
  ) {
    super(`Cannot change the "${attribute}" because the "${parentKind}" does not exist.`);
  }
}

/**
 * If trying to remove a node but that node no longer exists. E.g. remove a directive from
 * a type, but that type does not exist.
 */
export class DeletedAncestorCoordinateNotFoundError extends NoopError {
  constructor(
    public readonly parentKind: Kind,
    readonly attribute: NodeAttribute,
    readonly expectedValue: string | undefined,
  ) {
    super(
      `Cannot delete ${expectedValue ? `"${expectedValue}" ` : ''}from "${attribute}" on "${parentKind}" because the "${parentKind}" does not exist.`,
    );
  }
}

/**
 * If adding an attribute to a node, but that attribute already exists.
 * E.g. adding an interface but that interface is already applied to the type.
 */
export class AddedAttributeAlreadyExistsError extends NoopError {
  constructor(
    public readonly parentKind: Kind,
    readonly attribute: NodeAttribute,
    readonly attributeValue: string,
  ) {
    super(
      `Cannot add "${attributeValue}" to "${attribute}" on "${parentKind}" because it already exists.`,
    );
  }
}

/**
 * If deleting an attribute from a node, but that attribute does not exist.
 * E.g. deleting an interface but that interface is not applied to the type.
 */
export class DeletedAttributeNotFoundError extends NoopError {
  constructor(
    public readonly parentKind: Kind,
    readonly attribute: NodeAttribute,
    public readonly value: string,
  ) {
    super(
      `Cannot delete "${value}" from "${parentKind}"'s "${attribute}" because "${value}" does not exist.`,
    );
  }
}

export class ChangedCoordinateNotFoundError extends Error {
  constructor(expectedKind: Kind, expectedNameOrValue: string | undefined) {
    super(
      `The "${expectedKind}" ${expectedNameOrValue ? `"${expectedNameOrValue}" ` : ''}does not exist.`,
    );
  }
}

export class DeletedCoordinateNotFound extends NoopError {
  constructor(expectedKind: Kind, expectedNameOrValue: string | undefined) {
    const expected = expectedNameOrValue ? `${expectedNameOrValue} ` : '';
    super(`The removed "${expectedKind}" ${expected}already does not exist.`);
  }
}

export class ChangedCoordinateKindMismatchError extends Error {
  constructor(
    public readonly expectedKind: Kind,
    public readonly receivedKind: Kind,
  ) {
    super(`Expected type to have be a "${expectedKind}", but found a "${receivedKind}".`);
  }
}

/**
 * This should not happen unless there's an issue with the diff creation.
 */
export class ChangePathMissingError extends Error {
  constructor(public readonly change: Change<any>) {
    super(`The change is missing a "path". Cannot apply.`);
  }
}
