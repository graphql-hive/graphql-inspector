import {
  GraphQLArgument,
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
  Kind,
} from 'graphql';
import { compareDirectiveLists, diffArrays, isNotEqual, isVoid } from '../utils/compare.js';
import { isDeprecated } from '../utils/is-deprecated.js';
import {
  fieldArgumentDefaultChanged,
  fieldArgumentDeprecationAdded,
  fieldArgumentDeprecationReasonAdded,
  fieldArgumentDeprecationReasonChanged,
  fieldArgumentDeprecationReasonRemoved,
  fieldArgumentDeprecationRemoved,
  fieldArgumentDescriptionChanged,
  fieldArgumentTypeChanged,
} from './changes/argument.js';
import {
  directiveUsageAdded,
  directiveUsageChanged,
  directiveUsageRemoved,
} from './changes/directive-usage.js';
import { AddChange } from './schema.js';

const DEPRECATION_REASON_DEFAULT = 'No longer supported';

export function changesInArgument(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  oldArg: GraphQLArgument | null,
  newArg: GraphQLArgument,
  addChange: AddChange,
) {
  if (isNotEqual(oldArg?.description, newArg.description)) {
    addChange(fieldArgumentDescriptionChanged(type, field, oldArg, newArg));
  }

  if (isVoid(oldArg) || !isDeprecated(oldArg)) {
    if (isDeprecated(newArg)) {
      addChange(fieldArgumentDeprecationAdded(type, field, newArg));
    }
  } else if (!isDeprecated(newArg)) {
    if (isDeprecated(oldArg)) {
      addChange(fieldArgumentDeprecationRemoved(type, field, oldArg));
    }
  } else if (isNotEqual(oldArg.deprecationReason, newArg.deprecationReason)) {
    if (
      isVoid(oldArg.deprecationReason) ||
      oldArg.deprecationReason === DEPRECATION_REASON_DEFAULT
    ) {
      addChange(fieldArgumentDeprecationReasonAdded(type, field, newArg));
    } else if (
      isVoid(newArg.deprecationReason) ||
      newArg.deprecationReason === DEPRECATION_REASON_DEFAULT
    ) {
      addChange(fieldArgumentDeprecationReasonRemoved(type, field, oldArg));
    } else {
      addChange(fieldArgumentDeprecationReasonChanged(type, field, oldArg, newArg));
    }
  }

  if (isNotEqual(oldArg?.defaultValue, newArg.defaultValue)) {
    if (Array.isArray(oldArg?.defaultValue) && Array.isArray(newArg.defaultValue)) {
      const diff = diffArrays(oldArg.defaultValue, newArg.defaultValue);
      if (diff.length > 0) {
        addChange(fieldArgumentDefaultChanged(type, field, oldArg, newArg));
      }
    } else if (JSON.stringify(oldArg?.defaultValue) !== JSON.stringify(newArg.defaultValue)) {
      addChange(fieldArgumentDefaultChanged(type, field, oldArg, newArg));
    }
  }

  if (isNotEqual(oldArg?.type.toString(), newArg.type.toString())) {
    addChange(fieldArgumentTypeChanged(type, field, oldArg, newArg));
  }

  compareDirectiveLists(oldArg?.astNode?.directives || [], newArg.astNode?.directives || [], {
    onAdded(directive) {
      addChange(
        directiveUsageAdded(
          Kind.ARGUMENT,
          directive,
          {
            argument: newArg,
            field,
            type,
          },
          oldArg === null,
        ),
      );
      directiveUsageChanged(null, directive, addChange, type, field, newArg);
    },

    onMutual(directive) {
      directiveUsageChanged(
        directive.oldVersion,
        directive.newVersion,
        addChange,
        type,
        field,
        newArg,
      );
    },

    onRemoved(directive) {
      addChange(
        directiveUsageRemoved(Kind.ARGUMENT, directive, { argument: oldArg!, field, type }),
      );
    },
  });
}
