import {
  GraphQLArgument,
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
  Kind,
  print,
} from 'graphql';
import { compareDirectiveLists, diffArrays, isNotEqual } from '../utils/compare.js';
import {
  fieldArgumentDefaultChanged,
  fieldArgumentDescriptionChanged,
  fieldArgumentTypeChanged,
} from './changes/argument.js';
import {
  directiveUsageAdded,
  directiveUsageChanged,
  directiveUsageRemoved,
} from './changes/directive-usage.js';
import { AddChange } from './schema.js';

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

  // GraphQL <17 compat
  const oldArgDefaultValue = oldArg?.default?.literal
    ? print(oldArg.default.literal)
    : oldArg?.defaultValue;
  const newArgDefaultValue = newArg?.default?.literal
    ? print(newArg.default.literal)
    : newArg.defaultValue;

  if (isNotEqual(oldArgDefaultValue, newArgDefaultValue)) {
    if (Array.isArray(oldArgDefaultValue) && Array.isArray(newArgDefaultValue)) {
      const diff = diffArrays(oldArgDefaultValue, newArgDefaultValue);
      if (diff.length > 0) {
        addChange(fieldArgumentDefaultChanged(type, field, oldArg, newArg));
      }
    } else if (JSON.stringify(oldArgDefaultValue) !== JSON.stringify(newArgDefaultValue)) {
      addChange(fieldArgumentDefaultChanged(type, field, oldArg, newArg));
    }
  }

  if (isNotEqual(oldArg?.type.toString(), newArg.type.toString())) {
    addChange(fieldArgumentTypeChanged(type, field, oldArg, newArg));
  }

  if (oldArg?.astNode?.directives || newArg.astNode?.directives) {
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
}
