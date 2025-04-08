import { GraphQLInputField, GraphQLInputObjectType, isNonNullType } from 'graphql';
import { safeChangeForInputValue } from '../../utils/graphql.js';
import { isDeprecated } from '../../utils/is-deprecated.js';
import { safeString } from '../../utils/string.js';
import {
  Change,
  ChangeType,
  CriticalityLevel,
  InputFieldAddedChange,
  InputFieldDefaultValueChangedChange,
  InputFieldDescriptionAddedChange,
  InputFieldDescriptionChangedChange,
  InputFieldDescriptionRemovedChange,
  InputFieldRemovedChange,
  InputFieldTypeChangedChange,
} from './change.js';

function buildInputFieldRemovedMessage(args: InputFieldRemovedChange['meta']) {
  return `Input field '${args.removedFieldName}' ${
    args.isInputFieldDeprecated ? '(deprecated) ' : ''
  }was removed from input object type '${args.inputName}'`;
}

export function inputFieldRemovedFromMeta(args: InputFieldRemovedChange) {
  return {
    type: ChangeType.InputFieldRemoved,
    criticality: {
      level: CriticalityLevel.Breaking,
      reason:
        'Removing an input field will cause existing queries that use this input field to error.',
    },
    message: buildInputFieldRemovedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.inputName, args.meta.removedFieldName].join('.'),
  } as const;
}

export function inputFieldRemoved(
  input: GraphQLInputObjectType,
  field: GraphQLInputField,
): Change<typeof ChangeType.InputFieldRemoved> {
  return inputFieldRemovedFromMeta({
    type: ChangeType.InputFieldRemoved,
    meta: {
      inputName: input.name,
      removedFieldName: field.name,
      isInputFieldDeprecated: isDeprecated(field),
    },
  });
}

export function buildInputFieldAddedMessage(args: InputFieldAddedChange['meta']) {
  const defaultValueSuffix = args.hasDefaultValue ? ' with a default value' : '';
  return `Input field '${args.addedInputFieldName}' of type '${args.addedInputFieldType}'${defaultValueSuffix} was added to input object type '${args.inputName}'`;
}

export function inputFieldAddedFromMeta(args: InputFieldAddedChange) {
  return {
    type: ChangeType.InputFieldAdded,
    criticality: args.meta.isAddedInputFieldBreaking
      ? {
          level: CriticalityLevel.Breaking,
          reason:
            'Adding a required input field to an existing input object type is a breaking change because it will cause existing uses of this input object type to error.',
        }
      : {
        level: CriticalityLevel.Dangerous,
        },
    message: buildInputFieldAddedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.inputName, args.meta.addedInputFieldName].join('.'),
  } as const;
}

export function inputFieldAdded(
  input: GraphQLInputObjectType,
  field: GraphQLInputField,
): Change<typeof ChangeType.InputFieldAdded> {
  const isBreaking = isNonNullType(field.type) && typeof field.defaultValue === 'undefined';

  return inputFieldAddedFromMeta({
    type: ChangeType.InputFieldAdded,
    meta: {
      inputName: input.name,
      addedInputFieldName: field.name,
      isAddedInputFieldTypeNullable: !isNonNullType(field.type),
      addedInputFieldType: field.type.toString(),
      hasDefaultValue: field.defaultValue != null,
      isAddedInputFieldBreaking: isBreaking,
    },
  });
}

function buildInputFieldDescriptionAddedMessage(args: InputFieldDescriptionAddedChange['meta']) {
  return `Input field '${args.inputName}.${args.inputFieldName}' has description '${args.addedInputFieldDescription}'`;
}

export function inputFieldDescriptionAddedFromMeta(args: InputFieldDescriptionAddedChange) {
  return {
    type: ChangeType.InputFieldDescriptionAdded,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildInputFieldDescriptionAddedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.inputName, args.meta.inputFieldName].join('.'),
  } as const;
}

export function inputFieldDescriptionAdded(
  type: GraphQLInputObjectType,
  field: GraphQLInputField,
): Change<typeof ChangeType.InputFieldDescriptionAdded> {
  return inputFieldDescriptionAddedFromMeta({
    type: ChangeType.InputFieldDescriptionAdded,
    meta: {
      inputName: type.name,
      inputFieldName: field.name,
      addedInputFieldDescription: field.description ?? '',
    },
  });
}

function buildInputFieldDescriptionRemovedMessage(
  args: InputFieldDescriptionRemovedChange['meta'],
) {
  return `Description '${args.removedDescription}' was removed from input field '${args.inputName}.${args.inputFieldName}'`;
}

export function inputFieldDescriptionRemovedFromMeta(args: InputFieldDescriptionRemovedChange) {
  return {
    type: ChangeType.InputFieldDescriptionRemoved,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildInputFieldDescriptionRemovedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.inputName, args.meta.inputFieldName].join('.'),
  } as const;
}

export function inputFieldDescriptionRemoved(
  type: GraphQLInputObjectType,
  field: GraphQLInputField,
): Change<typeof ChangeType.InputFieldDescriptionRemoved> {
  return inputFieldDescriptionRemovedFromMeta({
    type: ChangeType.InputFieldDescriptionRemoved,
    meta: {
      inputName: type.name,
      inputFieldName: field.name,
      removedDescription: field.description ?? '',
    },
  });
}

function buildInputFieldDescriptionChangedMessage(
  args: InputFieldDescriptionChangedChange['meta'],
) {
  return `Input field '${args.inputName}.${args.inputFieldName}' description changed from '${args.oldInputFieldDescription}' to '${args.newInputFieldDescription}'`;
}

export function inputFieldDescriptionChangedFromMeta(args: InputFieldDescriptionChangedChange) {
  return {
    type: ChangeType.InputFieldDescriptionChanged,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildInputFieldDescriptionChangedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.inputName, args.meta.inputFieldName].join('.'),
  } as const;
}

export function inputFieldDescriptionChanged(
  input: GraphQLInputObjectType,
  oldField: GraphQLInputField,
  newField: GraphQLInputField,
): Change<typeof ChangeType.InputFieldDescriptionChanged> {
  return inputFieldDescriptionChangedFromMeta({
    type: ChangeType.InputFieldDescriptionChanged,
    meta: {
      inputName: input.name,
      inputFieldName: oldField.name,
      oldInputFieldDescription: oldField.description ?? '',
      newInputFieldDescription: newField.description ?? '',
    },
  });
}

function buildInputFieldDefaultValueChangedMessage(
  args: InputFieldDefaultValueChangedChange['meta'],
) {
  return `Input field '${args.inputName}.${args.inputFieldName}' default value changed from '${args.oldDefaultValue}' to '${args.newDefaultValue}'`;
}

export function inputFieldDefaultValueChangedFromMeta(args: InputFieldDefaultValueChangedChange) {
  return {
    type: ChangeType.InputFieldDefaultValueChanged,
    criticality: {
      level: CriticalityLevel.Dangerous,
      reason:
        'Changing the default value for an argument may change the runtime behavior of a field if it was never provided.',
    },
    message: buildInputFieldDefaultValueChangedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.inputName, args.meta.inputFieldName].join('.'),
  } as const;
}

export function inputFieldDefaultValueChanged(
  input: GraphQLInputObjectType,
  oldField: GraphQLInputField,
  newField: GraphQLInputField,
): Change<typeof ChangeType.InputFieldDefaultValueChanged> {
  const meta: InputFieldDefaultValueChangedChange['meta'] = {
    inputName: input.name,
    inputFieldName: oldField.name,
  };

  if (oldField.defaultValue !== undefined) {
    meta.oldDefaultValue = safeString(oldField.defaultValue);
  }
  if (newField.defaultValue !== undefined) {
    meta.newDefaultValue = safeString(newField.defaultValue);
  }
  return inputFieldDefaultValueChangedFromMeta({
    type: ChangeType.InputFieldDefaultValueChanged,
    meta,
  });
}

function buildInputFieldTypeChangedMessage(args: InputFieldTypeChangedChange['meta']) {
  return `Input field '${args.inputName}.${args.inputFieldName}' changed type from '${args.oldInputFieldType}' to '${args.newInputFieldType}'`;
}

export function inputFieldTypeChangedFromMeta(args: InputFieldTypeChangedChange) {
  return {
    type: ChangeType.InputFieldTypeChanged,
    criticality: args.meta.isInputFieldTypeChangeSafe
      ? {
          level: CriticalityLevel.NonBreaking,
          reason: 'Changing an input field from non-null to null is considered non-breaking.',
        }
      : {
          level: CriticalityLevel.Breaking,
          reason:
            'Changing the type of an input field can cause existing queries that use this field to error.',
        },
    message: buildInputFieldTypeChangedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.inputName, args.meta.inputFieldName].join('.'),
  } as const;
}

export function inputFieldTypeChanged(
  input: GraphQLInputObjectType,
  oldField: GraphQLInputField,
  newField: GraphQLInputField,
): Change<typeof ChangeType.InputFieldTypeChanged> {
  return inputFieldTypeChangedFromMeta({
    type: ChangeType.InputFieldTypeChanged,
    meta: {
      inputName: input.name,
      inputFieldName: oldField.name,
      oldInputFieldType: oldField.type.toString(),
      newInputFieldType: newField.type.toString(),
      isInputFieldTypeChangeSafe: safeChangeForInputValue(oldField.type, newField.type),
    },
  });
}
