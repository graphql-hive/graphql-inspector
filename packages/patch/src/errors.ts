import { Kind } from 'graphql';
import type { Change } from '@graphql-inspector/core';
import type { PatchConfig } from './types.js';

export function handleError(change: Change<any>, err: Error, config: PatchConfig) {
  if (err instanceof NoopError) {
    console.debug(
      `Ignoring change ${change.type} at "${change.path}" because it does not modify the resulting schema.`,
    );
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

export class CoordinateNotFoundError extends Error {
  constructor() {
    super('Cannot find an element at the schema coordinate.');
  }
}

export class DeletedCoordinateNotFoundError extends NoopError {
  constructor() {
    super('Cannot find an element at the schema coordinate.');
  }
}

export class CoordinateAlreadyExistsError extends NoopError {
  constructor(public readonly kind: Kind) {
    super(`A "${kind}" already exists at the schema coordinate.`);
  }
}

export class DeprecationReasonAlreadyExists extends NoopError {
  constructor(reason: string) {
    super(`A deprecation reason already exists: "${reason}"`);
  }
}

export class DeprecatedDirectiveNotFound extends NoopError {
  constructor() {
    super('This coordinate is not deprecated.');
  }
}

export class EnumValueNotFoundError extends Error {
  constructor(typeName: string, value?: string | undefined) {
    super(`The enum "${typeName}" does not contain "${value}".`);
  }
}

export class UnionMemberNotFoundError extends NoopError {
  constructor() {
    super(`The union does not contain the member.`);
  }
}

export class UnionMemberAlreadyExistsError extends NoopError {
  constructor(typeName: string, type: string) {
    super(`The union "${typeName}" already contains the member "${type}".`);
  }
}

export class DirectiveLocationAlreadyExistsError extends NoopError {
  constructor(directiveName: string, location: string) {
    super(`The directive "${directiveName}" already can be located on "${location}".`);
  }
}

export class DirectiveAlreadyExists extends NoopError {
  constructor(directiveName: string) {
    super(`The directive "${directiveName}" already exists.`);
  }
}

export class KindMismatchError extends Error {
  constructor(
    public readonly expectedKind: Kind,
    public readonly receivedKind: Kind,
  ) {
    super(`Expected type to have be a "${expectedKind}", but found a "${receivedKind}".`);
  }
}

export class FieldTypeMismatchError extends Error {
  constructor(expectedReturnType: string, receivedReturnType: string) {
    super(`Expected the field to return ${expectedReturnType} but found ${receivedReturnType}.`);
  }
}

export class OldValueMismatchError extends Error {
  constructor(
    expectedValue: string | null | undefined,
    receivedOldValue: string | null | undefined,
  ) {
    super(`Expected the value ${expectedValue} but found ${receivedOldValue}.`);
  }
}

export class OldTypeMismatchError extends Error {
  constructor(expectedType: string | null | undefined, receivedOldType: string | null | undefined) {
    super(`Expected the type ${expectedType} but found ${receivedOldType}.`);
  }
}

export class InterfaceAlreadyExistsOnTypeError extends NoopError {
  constructor(interfaceName: string) {
    super(
      `Cannot add the interface "${interfaceName}" because it already is applied at that coordinate.`,
    );
  }
}

export class ArgumentDefaultValueMismatchError extends Error {
  constructor(
    expectedDefaultValue: string | undefined | null,
    actualDefaultValue: string | undefined | null,
  ) {
    super(
      `The argument's default value "${actualDefaultValue}" does not match the expected value "${expectedDefaultValue}".`,
    );
  }
}

export class ArgumentDescriptionMismatchError extends Error {
  constructor(
    expectedDefaultValue: string | undefined | null,
    actualDefaultValue: string | undefined | null,
  ) {
    super(
      `The argument's description "${actualDefaultValue}" does not match the expected "${expectedDefaultValue}".`,
    );
  }
}

export class DescriptionMismatchError extends NoopError {
  constructor(
    expectedDescription: string | undefined | null,
    actualDescription: string | undefined | null,
  ) {
    super(
      `The description, "${actualDescription}", does not the expected description, "${expectedDescription}".`,
    );
  }
}
