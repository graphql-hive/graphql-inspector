import { Kind } from 'graphql';
import type { Change } from '@graphql-inspector/core';
import type { ChangesByType, ErrorHandler } from './types.js';
import { parentPath } from './utils.js';

/**
 * The strictest of the standard error handlers. This checks if the error is a "No-op",
 * meaning if the change wouldn't impact the schema at all, and ignores the error
 * only in this one case. Otherwise, the error is raised.
 */
export const strictErrorHandler: ErrorHandler = (err, _change) => {
  if (err instanceof NoopError) {
    console.debug(`[IGNORED] ${err.message}`);
  } else {
    throw err;
  }
};

/**
 * A convenient, semi-strict error handler. This ignores "no-op" errors -- if
 * the change wouldn't impact the patched schema at all. And it ignores
 * value mismatches, which are when the change notices that the value captured in
 * the change doesn't match the value in the patched schema.
 *
 * For example, if the change indicates the default value WAS "foo" before being
 * changed, but the patch is applied to a schema where the default value is "bar".
 * This is useful to avoid overwriting changes unknowingly that may have occurred
 * from other sources.
 */
export const defaultErrorHandler: ErrorHandler = (err, change) => {
  if (err instanceof NoopError) {
    console.debug(`[IGNORED] ${err.message}`);
  } else if (err instanceof ValueMismatchError) {
    console.debug(`Ignoring old value mismatch at "${change.path}".`);
  } else {
    throw err;
  }
};

/**
 * The least strict error handler. This will only log errors and will never
 * raise an error. This is potentially useful for getting a patched schema
 * rendered, and then handling the conflict/error in a separate step. E.g.
 * if creating a merge conflict resolution UI.
 */
export const looseErrorHandler: ErrorHandler = (err, change) => {
  if (err instanceof NoopError) {
    console.debug(`[IGNORED] ${err.message}`);
  } else if (err instanceof ValueMismatchError) {
    console.debug(`Ignoring old value mismatch at "${change.path}".`);
  } else {
    console.warn(err.message);
  }
};

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
      `The existing value did not match what was expected. Expected the "${kind}" to be "${String(expected)}" but found "${String(actual)}".`,
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
    public readonly path: string,
    public readonly changeType: keyof ChangesByType,
  ) {
    const subpath = path.substring(path.lastIndexOf('.') + 1);
    const parent = parentPath(path);
    const printedParent = parent === subpath ? 'schema' : `"${parent}"`;
    super(
      `Cannot apply "${changeType}" to add "${subpath}" to ${printedParent} because that schema coordinate already exists.`,
    );
  }
}

export class AddedAttributeCoordinateNotFoundError extends Error {
  constructor(
    public readonly path: string,
    public readonly changeType: keyof ChangesByType,
    /**
     * The value of what is being changed at the path. E.g. if the description is being changed, then this should
     * be the description string.
     */
    public readonly changeValue: string | number | null,
  ) {
    const subpath = path.substring(path.lastIndexOf('.'));
    super(
      `Cannot apply addition "${changeType}" (${changeValue}) to "${subpath}", because "${path}" does not exist.`,
    );
  }
}

/**
 * If trying to manipulate a node at a path, but that path no longer exists. E.g. change a description of
 * a type, but that type was previously deleted.
 */
export class ChangedAncestorCoordinateNotFoundError extends Error {
  constructor(
    public readonly path: string,
    public readonly changeType: keyof ChangesByType,
    /**
     * The value of what is being changed at the path. E.g. if the description is being changed, then this should
     * be the description string.
     */
    public readonly changeValue: string | number | boolean | null,
  ) {
    const subpath = path.substring(path.lastIndexOf('.'));
    super(
      `Cannot apply change "${changeType}" (${typeof changeValue === 'string' ? `"${changeValue}"` : changeValue}) to "${subpath}", because the "${parentPath(path)}" does not exist.`,
    );
  }
}

/**
 * If trying to remove a node but that node no longer exists. E.g. remove a directive from
 * a type, but that type does not exist.
 */
export class DeletedAncestorCoordinateNotFoundError extends NoopError {
  constructor(
    public readonly path: string,
    public readonly changeType: keyof ChangesByType,
    /**
     * The value of what is being changed at the path. E.g. if the description is being changed, then this should
     * be the description string.
     */
    public readonly expectedValue: string | number | boolean | null,
  ) {
    const subpath = path.substring(path.lastIndexOf('.'));
    super(
      `Cannot apply "${changeType}" to remove ${typeof expectedValue === 'string' ? `"${expectedValue}"` : expectedValue}} from "${subpath}", because "${parentPath(path)}" does not exist.`,
    );
  }
}

/**
 * If adding an attribute to a node, but that attribute already exists.
 * E.g. adding an interface but that interface is already applied to the type.
 */
export class AddedAttributeAlreadyExistsError extends NoopError {
  constructor(
    public readonly path: string,
    public readonly changeType: string,
    /** The property's path on the node. E.g. defaultValue */
    public readonly attribute: string,
    public readonly expectedValue?: string,
  ) {
    const subpath = path.substring(path.lastIndexOf('.'));
    super(
      `Cannot apply "${changeType}" to add ${typeof expectedValue === 'string' ? `"${expectedValue}"` : expectedValue} to "${subpath}.${attribute}", because it already exists`,
    );
  }
}

/**
 * If deleting an attribute from a node, but that attribute does not exist.
 * E.g. deleting an interface but that interface is not applied to the type.
 */
export class DeletedAttributeNotFoundError extends NoopError {
  constructor(
    public readonly path: string,
    public readonly changeType: string,
    /** The property's path on the node. E.g. defaultValue */
    public readonly attribute: string,
    public readonly expectedValue?: string,
  ) {
    const subpath = path.substring(path.lastIndexOf('.'));
    super(
      `Cannot apply "${changeType}" to remove ${typeof expectedValue === 'string' ? `"${expectedValue}"` : expectedValue}} from ${subpath}'s "${attribute}", because "${attribute}" does not exist at "${path}".`,
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
    super(
      `The change "${change.type}" at "${change.path}" is missing a "path" value. Cannot apply.`,
    );
  }
}
