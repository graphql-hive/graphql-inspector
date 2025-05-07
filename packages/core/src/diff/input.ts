import { GraphQLInputField, GraphQLInputObjectType, Kind } from 'graphql';
import { compareLists, diffArrays, isNotEqual, isVoid } from '../utils/compare.js';
import { directiveUsageAdded, directiveUsageRemoved } from './changes/directive-usage.js';
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
  oldInput: GraphQLInputObjectType,
  newInput: GraphQLInputObjectType,
  addChange: AddChange,
) {
  const oldFields = oldInput.getFields();
  const newFields = newInput.getFields();

  compareLists(Object.values(oldFields), Object.values(newFields), {
    onAdded(field) {
      addChange(inputFieldAdded(newInput, field));
    },
    onRemoved(field) {
      addChange(inputFieldRemoved(oldInput, field));
    },
    onMutual(field) {
      changesInInputField(oldInput, field.oldVersion, field.newVersion, addChange);
    },
  });

  compareLists(oldInput.astNode?.directives || [], newInput.astNode?.directives || [], {
    onAdded(directive) {
      addChange(directiveUsageAdded(Kind.INPUT_OBJECT_TYPE_DEFINITION, directive, newInput));
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.INPUT_OBJECT_TYPE_DEFINITION, directive, oldInput));
    },
  });
}

function changesInInputField(
  input: GraphQLInputObjectType,
  oldField: GraphQLInputField,
  newField: GraphQLInputField,
  addChange: AddChange,
) {
  if (isNotEqual(oldField.description, newField.description)) {
    if (isVoid(oldField.description)) {
      addChange(inputFieldDescriptionAdded(input, newField));
    } else if (isVoid(newField.description)) {
      addChange(inputFieldDescriptionRemoved(input, oldField));
    } else {
      addChange(inputFieldDescriptionChanged(input, oldField, newField));
    }
  }

  if (isNotEqual(oldField.defaultValue, newField.defaultValue)) {
    if (Array.isArray(oldField.defaultValue) && Array.isArray(newField.defaultValue)) {
      if (diffArrays(oldField.defaultValue, newField.defaultValue).length > 0) {
        addChange(inputFieldDefaultValueChanged(input, oldField, newField));
      }
    } else if (JSON.stringify(oldField.defaultValue) !== JSON.stringify(newField.defaultValue)) {
      addChange(inputFieldDefaultValueChanged(input, oldField, newField));
    }
  }

  if (isNotEqual(oldField.type.toString(), newField.type.toString())) {
    addChange(inputFieldTypeChanged(input, oldField, newField));
  }

  // TODO: Heshan -> Introduce a mutual option to this function to detect changes in directive usage
  if (oldField.astNode?.directives && newField.astNode?.directives) {
    compareLists(oldField.astNode.directives || [], newField.astNode.directives || [], {
      onAdded(directive) {
        addChange(
          directiveUsageAdded(Kind.INPUT_VALUE_DEFINITION, directive, {
            type: input,
            field: newField,
          }),
        );
      },
      onRemoved(directive) {
        addChange(
          directiveUsageRemoved(Kind.INPUT_VALUE_DEFINITION, directive, {
            type: input,
            field: oldField,
          }),
        );
      },
    });
  }
}
