import {
  GraphQLDeprecatedDirective,
  GraphQLInputField,
  GraphQLInputObjectType,
  isNonNullType,
} from 'graphql';
import { safeChangeForInputValue } from '../../utils/graphql.js';
import { isDeprecated } from '../../utils/is-deprecated.js';
import { fmt, safeString } from '../../utils/string.js';
import {
  Change,
  ChangeType,
  CriticalityLevel,
  InputFieldAddedChange,
  InputFieldDefaultValueChangedChange,
  InputFieldDeprecationAddedChange,
  InputFieldDeprecationReasonAddedChange,
  InputFieldDeprecationReasonChangedChange,
  InputFieldDeprecationReasonRemovedChange,
  InputFieldDeprecationRemovedChange,
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
  return `Input field '${args.addedInputFieldName}' of type '${args.addedInputFieldType}'${args.addedFieldDefault ? ` with default value '${args.addedFieldDefault}'` : ''} was added to input object type '${args.inputName}'`;
}

export function inputFieldAddedFromMeta(args: InputFieldAddedChange) {
  let criticality: {
    level: CriticalityLevel;
    reason?: string;
  };
  const addedNullableWithoutDefault =
    args.meta.isAddedInputFieldTypeNullable && args.meta.addedFieldDefault === undefined;

  if (args.meta.addedToNewType) {
    criticality = {
      level: CriticalityLevel.NonBreaking,
      reason: 'The field is being added to a new type.',
    };
  } else if (addedNullableWithoutDefault) {
    criticality = {
      level: CriticalityLevel.NonBreaking,
      reason: 'The field is nullable and no default is set.',
    };
  } else if (args.meta.addedFieldDefault === undefined) {
    criticality = {
      level: CriticalityLevel.Breaking,
      reason:
        'Adding a required input field to an existing input object type is a breaking change because it will cause existing uses of this input object type to error.',
    };
  } else {
    criticality = {
      level: CriticalityLevel.Dangerous,
      reason:
        'Adding a field with a default value can change runtime behavior for clients that previously omitted it, and during rolling deploys consumers may receive the new default before producers are ready to handle it.',
    };
  }

  return {
    type: ChangeType.InputFieldAdded,
    criticality,
    message: buildInputFieldAddedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.inputName, args.meta.addedInputFieldName].join('.'),
  } as const;
}

export function inputFieldAdded(
  input: GraphQLInputObjectType,
  field: GraphQLInputField,
  addedToNewType: boolean,
): Change<typeof ChangeType.InputFieldAdded> {
  return inputFieldAddedFromMeta({
    type: ChangeType.InputFieldAdded,
    meta: {
      inputName: input.name,
      addedInputFieldName: field.name,
      isAddedInputFieldTypeNullable: !isNonNullType(field.type),
      addedInputFieldType: field.type.toString(),
      ...(field.defaultValue === undefined
        ? {}
        : { addedFieldDefault: safeString(field.defaultValue) }),
      addedToNewType,
    },
  });
}

function buildInputFieldDescriptionAddedMessage(args: InputFieldDescriptionAddedChange['meta']) {
  const desc = fmt(args.addedInputFieldDescription);
  return `Input field '${args.inputName}.${args.inputFieldName}' has description '${desc}'`;
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
  const desc = fmt(args.removedDescription);
  return `Description '${desc}' was removed from input field '${args.inputName}.${args.inputFieldName}'`;
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
  const oldDesc = fmt(args.oldInputFieldDescription);
  const newDesc = fmt(args.newInputFieldDescription);
  return `Input field '${args.inputName}.${args.inputFieldName}' description changed from '${oldDesc}' to '${newDesc}'`;
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
  const criticality = {
    level: CriticalityLevel.Dangerous,
    reason:
      'Changing the default value for an argument may change the runtime behavior of a field if it was never provided.',
  };
  return {
    type: ChangeType.InputFieldDefaultValueChanged,
    criticality,
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
    inputFieldName: newField.name,
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
      inputFieldName: newField.name,
      oldInputFieldType: oldField.type.toString(),
      newInputFieldType: newField.type.toString(),
      isInputFieldTypeChangeSafe: safeChangeForInputValue(oldField.type, newField.type),
    },
  });
}

function buildInputFieldDeprecatedAddedMessage(args: InputFieldDeprecationAddedChange['meta']) {
  return `Input field '${args.inputName}.${args.inputFieldName}' is deprecated`;
}

export function inputFieldDeprecationAddedFromMeta(args: InputFieldDeprecationAddedChange) {
  return {
    type: ChangeType.InputFieldDeprecationAdded,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildInputFieldDeprecatedAddedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.inputName, args.meta.inputFieldName, `@${GraphQLDeprecatedDirective.name}`].join(
      '.',
    ),
  } as const;
}

export function inputFieldDeprecationAdded(
  input: GraphQLInputObjectType,
  field: GraphQLInputField,
): Change<typeof ChangeType.InputFieldDeprecationAdded> {
  return inputFieldDeprecationAddedFromMeta({
    type: ChangeType.InputFieldDeprecationAdded,
    meta: {
      inputName: input.name,
      inputFieldName: field.name,
      deprecationReason: field.deprecationReason ?? '',
    },
  });
}

export function inputFieldDeprecationRemovedFromMeta(args: InputFieldDeprecationRemovedChange) {
  return {
    type: ChangeType.InputFieldDeprecationRemoved,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: `Input field '${args.meta.inputName}.${args.meta.inputFieldName}' is no longer deprecated`,
    meta: args.meta,
    path: [args.meta.inputName, args.meta.inputFieldName, `@${GraphQLDeprecatedDirective.name}`].join(
      '.',
    ),
  } as const;
}

export function inputFieldDeprecationRemoved(
  input: GraphQLInputObjectType,
  field: GraphQLInputField,
): Change<typeof ChangeType.InputFieldDeprecationRemoved> {
  return inputFieldDeprecationRemovedFromMeta({
    type: ChangeType.InputFieldDeprecationRemoved,
    meta: {
      inputFieldName: field.name,
      inputName: input.name,
    },
  });
}

function buildInputFieldDeprecationReasonChangedMessage(
  args: InputFieldDeprecationReasonChangedChange['meta'],
) {
  const oldReason = fmt(args.oldDeprecationReason);
  const newReason = fmt(args.newDeprecationReason);
  return `Deprecation reason on input field '${args.inputName}.${args.inputFieldName}' has changed from '${oldReason}' to '${newReason}'`;
}

export function inputFieldDeprecationReasonChangedFromMeta(
  args: InputFieldDeprecationReasonChangedChange,
) {
  return {
    type: ChangeType.InputFieldDeprecationReasonChanged,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildInputFieldDeprecationReasonChangedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.inputName, args.meta.inputFieldName, `@${GraphQLDeprecatedDirective.name}`].join(
      '.',
    ),
  } as const;
}

export function inputFieldDeprecationReasonChanged(
  input: GraphQLInputObjectType,
  oldField: GraphQLInputField,
  newField: GraphQLInputField,
): Change<typeof ChangeType.InputFieldDeprecationReasonChanged> {
  return inputFieldDeprecationReasonChangedFromMeta({
    type: ChangeType.InputFieldDeprecationReasonChanged,
    meta: {
      inputFieldName: newField.name,
      inputName: input.name,
      newDeprecationReason: newField.deprecationReason ?? '',
      oldDeprecationReason: oldField.deprecationReason ?? '',
    },
  });
}

function buildInputFieldDeprecationReasonAddedMessage(
  args: InputFieldDeprecationReasonAddedChange['meta'],
) {
  const reason = fmt(args.addedDeprecationReason);
  return `Input field '${args.inputName}.${args.inputFieldName}' has deprecation reason '${reason}'`;
}

export function inputFieldDeprecationReasonAddedFromMeta(args: InputFieldDeprecationReasonAddedChange) {
  return {
    type: ChangeType.InputFieldDeprecationReasonAdded,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildInputFieldDeprecationReasonAddedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.inputName, args.meta.inputFieldName, `@${GraphQLDeprecatedDirective.name}`].join(
      '.',
    ),
  } as const;
}

export function inputFieldDeprecationReasonAdded(
  input: GraphQLInputObjectType,
  field: GraphQLInputField,
): Change<typeof ChangeType.InputFieldDeprecationReasonAdded> {
  return inputFieldDeprecationReasonAddedFromMeta({
    type: ChangeType.InputFieldDeprecationReasonAdded,
    meta: {
      inputName: input.name,
      inputFieldName: field.name,
      addedDeprecationReason: field.deprecationReason ?? '',
    },
  });
}

export function inputFieldDeprecationReasonRemovedFromMeta(
  args: InputFieldDeprecationReasonRemovedChange,
) {
  return {
    type: ChangeType.InputFieldDeprecationReasonRemoved,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: `Deprecation reason was removed from input field '${args.meta.inputName}.${args.meta.inputFieldName}'`,
    meta: args.meta,
    path: [args.meta.inputName, args.meta.inputFieldName].join('.'),
  } as const;
}

export function inputFieldDeprecationReasonRemoved(
  input: GraphQLInputObjectType,
  field: GraphQLInputField,
): Change<typeof ChangeType.InputFieldDeprecationReasonRemoved> {
  return inputFieldDeprecationReasonRemovedFromMeta({
    type: ChangeType.InputFieldDeprecationReasonRemoved,
    meta: {
      inputName: input.name,
      inputFieldName: field.name,
    },
  });
}
