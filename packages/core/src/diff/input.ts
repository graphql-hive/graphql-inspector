import { GraphQLInputField, GraphQLInputObjectType, Kind } from 'graphql';
import {
  compareDirectiveLists,
  compareLists,
  hasDirectiveUsageAst,
  isNotEqual,
  isVoid,
} from '../utils/compare.js';
import { defaultValuesAreEqual } from '../utils/graphql.js';
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
import type { AddChange, SkipDirectiveUsages } from './schema.js';

export function changesInInputObject(
  oldInput: GraphQLInputObjectType | null,
  newInput: GraphQLInputObjectType,
  addChange: AddChange,
  skipDirectiveUsages: SkipDirectiveUsages,
): void {
  const oldFields = oldInput?.getFields() ?? {};
  const newFields = newInput.getFields();

  compareLists(Object.values(oldFields), Object.values(newFields), {
    onAdded(field) {
      addChange(inputFieldAdded(newInput, field, oldInput == null));
      changesInInputField(newInput, null, field, addChange, skipDirectiveUsages);
    },
    onRemoved(field) {
      addChange(inputFieldRemoved(oldInput!, field));
    },
    onMutual(field) {
      changesInInputField(
        newInput,
        field.oldVersion,
        field.newVersion,
        addChange,
        skipDirectiveUsages,
      );
    },
  });

  if (!hasDirectiveUsageAst({ oldNode: oldInput, newNode: newInput })) {
    skipDirectiveUsages({ path: newInput.name, oldNode: oldInput, newNode: newInput });
    return;
  }

  compareDirectiveLists(oldInput?.astNode?.directives || [], newInput.astNode?.directives || [], {
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
  skipDirectiveUsages: SkipDirectiveUsages,
): void {
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
    if (!defaultValuesAreEqual(oldField, newField)) {
      addChange(inputFieldDefaultValueChanged(input, oldField, newField));
    }

    if (!isVoid(oldField) && isNotEqual(oldField.type.toString(), newField.type.toString())) {
      addChange(inputFieldTypeChanged(input, oldField, newField));
    }
  }

  if (!hasDirectiveUsageAst({ oldNode: oldField, newNode: newField })) {
    skipDirectiveUsages({
      path: `${input.name}.${newField.name}`,
      oldNode: oldField,
      newNode: newField,
    });
    return;
  }

  if (oldField?.astNode?.directives || newField.astNode?.directives) {
    compareDirectiveLists(oldField?.astNode?.directives || [], newField.astNode?.directives || [], {
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
