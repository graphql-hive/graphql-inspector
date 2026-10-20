import {
  GraphQLArgument,
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
  Kind,
} from 'graphql';
import { compareDirectiveLists, isNotEqual } from '../utils/compare.js';
import { defaultValuesAreEqual } from '../utils/graphql.js';
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

  if (!defaultValuesAreEqual(oldArg, newArg)) {
    addChange(fieldArgumentDefaultChanged(type, field, oldArg, newArg));
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
