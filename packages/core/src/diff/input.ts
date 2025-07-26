import { GraphQLInputField, GraphQLInputObjectType, Kind } from 'graphql';
import { compareLists, diffArrays, isNotEqual, isVoid } from '../utils/compare.js';
import {
  directiveUsageAdded,
  directiveUsageChanged,
  directiveUsageRemoved,
} from './changes/directive-usage.js';
import {
  inputFieldAdded,
  inputFieldDefaultValueChanged,
  inputFieldDescriptionAdded,
  inputFieldDescriptionChanged,
  inputFieldDescriptionRemoved,
  inputFieldRemoved,
  inputFieldTypeChanged,
} from './changes/input.js';
import { AddChange } from './schema.js';

export function changesInInputObject(
  oldInput: GraphQLInputObjectType | null,
  newInput: GraphQLInputObjectType,
  addChange: AddChange,
) {
  const oldFields = oldInput?.getFields() ?? {};
  const newFields = newInput.getFields();

  compareLists(Object.values(oldFields), Object.values(newFields), {
    onAdded(field) {
      addChange(inputFieldAdded(newInput, field, oldInput === null));
      changesInInputField(newInput, null, field, addChange);
    },
    onRemoved(field) {
      addChange(inputFieldRemoved(oldInput!, field));
    },
    onMutual(field) {
      changesInInputField(newInput, field.oldVersion, field.newVersion, addChange);
    },
  });

  compareLists(oldInput?.astNode?.directives || [], newInput.astNode?.directives || [], {
    onAdded(directive) {
      addChange(
        directiveUsageAdded(
          Kind.INPUT_OBJECT_TYPE_DEFINITION,
          directive,
          newInput,
          oldInput === null,
        ),
      );
      directiveUsageChanged(null, directive, addChange, newInput);
    },
    onMutual(directive) {
      directiveUsageChanged(directive.oldVersion, directive.newVersion, addChange, newInput);
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.INPUT_OBJECT_TYPE_DEFINITION, directive, oldInput!));
    },
  });
}

function changesInInputField(
  input: GraphQLInputObjectType,
  oldField: GraphQLInputField | null,
  newField: GraphQLInputField,
  addChange: AddChange,
) {
  if (isNotEqual(oldField?.description, newField.description)) {
    if (isVoid(oldField?.description)) {
      addChange(inputFieldDescriptionAdded(input, newField));
    } else if (isVoid(newField.description)) {
      addChange(inputFieldDescriptionRemoved(input, oldField!));
    } else {
      addChange(inputFieldDescriptionChanged(input, oldField!, newField));
    }
  }

  if (!isVoid(oldField)) {
    if (isNotEqual(oldField?.defaultValue, newField.defaultValue)) {
      if (Array.isArray(oldField?.defaultValue) && Array.isArray(newField.defaultValue)) {
        if (diffArrays(oldField.defaultValue, newField.defaultValue).length > 0) {
          addChange(inputFieldDefaultValueChanged(input, oldField, newField));
        }
      } else if (JSON.stringify(oldField?.defaultValue) !== JSON.stringify(newField.defaultValue)) {
        addChange(inputFieldDefaultValueChanged(input, oldField, newField));
      }
    }

    if (!isVoid(oldField) && isNotEqual(oldField.type.toString(), newField.type.toString())) {
      addChange(inputFieldTypeChanged(input, oldField, newField));
    }
  }

  if (newField.astNode?.directives) {
    compareLists(oldField?.astNode?.directives || [], newField.astNode.directives || [], {
      onAdded(directive) {
        addChange(
          directiveUsageAdded(
            Kind.INPUT_VALUE_DEFINITION,
            directive,
            {
              type: input,
              field: newField,
            },
            oldField === null,
          ),
        );
        directiveUsageChanged(null, directive, addChange, input, newField);
      },
      onMutual(directive) {
        directiveUsageChanged(
          directive.oldVersion,
          directive.newVersion,
          addChange,
          input,
          newField,
        );
      },
      onRemoved(directive) {
        addChange(
          directiveUsageRemoved(Kind.INPUT_VALUE_DEFINITION, directive, {
            type: input,
            field: newField,
          }),
        );
      },
    });
  }
}
