import { GraphQLField, GraphQLInterfaceType, GraphQLObjectType, Kind } from 'graphql';
import { compareLists, isNotEqual, isVoid } from '../utils/compare.js';
import { isDeprecated } from '../utils/is-deprecated.js';
import { changesInArgument } from './argument.js';
import { directiveUsageAdded, directiveUsageRemoved } from './changes/directive-usage.js';
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

export function changesInField(
  type: GraphQLObjectType | GraphQLInterfaceType,
  oldField: GraphQLField<any, any>,
  newField: GraphQLField<any, any>,
  addChange: AddChange,
) {
  if (isNotEqual(oldField.description, newField.description)) {
    if (isVoid(oldField.description)) {
      addChange(fieldDescriptionAdded(type, newField));
    } else if (isVoid(newField.description)) {
      addChange(fieldDescriptionRemoved(type, oldField));
    } else {
      addChange(fieldDescriptionChanged(type, oldField, newField));
    }
  }

  if (isNotEqual(isDeprecated(oldField), isDeprecated(newField))) {
    if (isDeprecated(newField)) {
      addChange(fieldDeprecationAdded(type, newField));
    } else {
      addChange(fieldDeprecationRemoved(type, oldField));
    }
  }

  if (isNotEqual(oldField.deprecationReason, newField.deprecationReason)) {
    if (isVoid(oldField.deprecationReason)) {
      addChange(fieldDeprecationReasonAdded(type, newField));
    } else if (isVoid(newField.deprecationReason)) {
      addChange(fieldDeprecationReasonRemoved(type, oldField));
    } else {
      addChange(fieldDeprecationReasonChanged(type, oldField, newField));
    }
  }

  if (isNotEqual(oldField.type.toString(), newField.type.toString())) {
    addChange(fieldTypeChanged(type, oldField, newField));
  }

  compareLists(oldField.args, newField.args, {
    onAdded(arg) {
      addChange(fieldArgumentAdded(type, newField, arg));
    },
    onRemoved(arg) {
      addChange(fieldArgumentRemoved(type, oldField, arg));
    },
    onMutual(arg) {
      changesInArgument(type, oldField, arg.oldVersion, arg.newVersion, addChange);
    },
  });

  // TODO: Heshan -> Introduce a mutual option to this function to detect changes in directive usage
  compareLists(oldField.astNode?.directives || [], newField.astNode?.directives || [], {
    onAdded(directive) {
      addChange(
        directiveUsageAdded(Kind.FIELD_DEFINITION, directive, {
          parentType: type,
          field: newField,
        }),
      );
    },
    onRemoved(arg) {
      addChange(
        directiveUsageRemoved(Kind.FIELD_DEFINITION, arg, {
          parentType: type,
          field: oldField,
        }),
      );
    },
  });
}
