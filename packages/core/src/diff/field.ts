import { GraphQLField, GraphQLInterfaceType, GraphQLObjectType, Kind } from 'graphql';
import { compareLists, isNotEqual, isVoid } from '../utils/compare.js';
import { isDeprecated } from '../utils/is-deprecated.js';
import { changesInArgument } from './argument.js';
import {
  directiveUsageAdded,
  directiveUsageChanged,
  directiveUsageRemoved,
} from './changes/directive-usage.js';
import {
  fieldArgumentAdded,
  fieldArgumentRemoved,
  fieldDeprecationAdded,
  fieldDeprecationReasonAdded,
  fieldDeprecationReasonChanged,
  fieldDeprecationReasonRemoved,
  fieldDeprecationRemoved,
  fieldDescriptionAdded,
  fieldDescriptionChanged,
  fieldDescriptionRemoved,
  fieldTypeChanged,
} from './changes/field.js';
import { AddChange } from './schema.js';

const DEPRECATION_REASON_DEFAULT = 'No longer supported';

export function changesInField(
  type: GraphQLObjectType | GraphQLInterfaceType,
  oldField: GraphQLField<any, any> | null,
  newField: GraphQLField<any, any>,
  addChange: AddChange,
) {
  if (isNotEqual(oldField?.description, newField.description)) {
    if (isVoid(oldField?.description)) {
      addChange(fieldDescriptionAdded(type, newField));
    } else if (isVoid(newField.description)) {
      addChange(fieldDescriptionRemoved(type, oldField!));
    } else {
      addChange(fieldDescriptionChanged(type, oldField!, newField));
    }
  }

  if (isVoid(oldField) || !isDeprecated(oldField)) {
    if (isDeprecated(newField)) {
      addChange(fieldDeprecationAdded(type, newField));
    }
  } else if (!isDeprecated(newField)) {
    if (isDeprecated(oldField)) {
      addChange(fieldDeprecationRemoved(type, oldField));
    }
  } else if (isNotEqual(oldField.deprecationReason, newField.deprecationReason)) {
    if (
      isVoid(oldField.deprecationReason) ||
      oldField.deprecationReason === DEPRECATION_REASON_DEFAULT
    ) {
      addChange(fieldDeprecationReasonAdded(type, newField));
    } else if (
      isVoid(newField.deprecationReason) ||
      newField.deprecationReason === DEPRECATION_REASON_DEFAULT
    ) {
      addChange(fieldDeprecationReasonRemoved(type, oldField));
    } else {
      addChange(fieldDeprecationReasonChanged(type, oldField, newField));
    }
  }

  if (!isVoid(oldField) && isNotEqual(oldField!.type.toString(), newField.type.toString())) {
    addChange(fieldTypeChanged(type, oldField!, newField));
  }

  compareLists(oldField?.args ?? [], newField.args, {
    onAdded(arg) {
      addChange(fieldArgumentAdded(type, newField, arg, oldField === null));
    },
    onRemoved(arg) {
      addChange(fieldArgumentRemoved(type, newField, arg));
    },
    onMutual(arg) {
      changesInArgument(type, newField, arg.oldVersion, arg.newVersion, addChange);
    },
  });

  compareLists(oldField?.astNode?.directives || [], newField.astNode?.directives || [], {
    onAdded(directive) {
      addChange(
        directiveUsageAdded(
          Kind.FIELD_DEFINITION,
          directive,
          {
            parentType: type,
            field: newField,
          },
          oldField === null,
        ),
      );
      directiveUsageChanged(null, directive, addChange, type, newField);
    },
    onMutual(directive) {
      directiveUsageChanged(directive.oldVersion, directive.newVersion, addChange, type, newField);
    },
    onRemoved(arg) {
      addChange(
        directiveUsageRemoved(Kind.FIELD_DEFINITION, arg, {
          parentType: type,
          field: oldField!,
        }),
      );
    },
  });
}
