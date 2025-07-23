import { GraphQLEnumType, GraphQLEnumValue, Kind } from 'graphql';
import { compareLists, isNotEqual, isVoid } from '../utils/compare.js';
import { directiveUsageAdded, directiveUsageRemoved } from './changes/directive-usage.js';
import {
  enumValueAdded,
  enumValueDeprecationReasonAdded,
  enumValueDeprecationReasonChanged,
  enumValueDeprecationReasonRemoved,
  enumValueDescriptionChanged,
  enumValueRemoved,
} from './changes/enum.js';
import { AddChange } from './schema.js';

export function changesInEnum(
  oldEnum: GraphQLEnumType | null,
  newEnum: GraphQLEnumType,
  addChange: AddChange,
) {
  compareLists(oldEnum?.getValues() ?? [], newEnum.getValues(), {
    onAdded(value) {
      addChange(enumValueAdded(newEnum, value, oldEnum === null));
      changesInEnumValue({ newVersion: value, oldVersion: null }, newEnum, addChange);
    },
    onRemoved(value) {
      addChange(enumValueRemoved(oldEnum!, value));
    },
    onMutual(value) {
      changesInEnumValue(value, newEnum, addChange);
    },
  });

  compareLists(oldEnum?.astNode?.directives || [], newEnum.astNode?.directives || [], {
    onAdded(directive) {
      addChange(
        directiveUsageAdded(Kind.ENUM_TYPE_DEFINITION, directive, newEnum, oldEnum === null),
      );
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.ENUM_TYPE_DEFINITION, directive, newEnum));
    },
  });
}

function changesInEnumValue(
  value: {
    newVersion: GraphQLEnumValue;
    oldVersion: GraphQLEnumValue | null;
  },
  newEnum: GraphQLEnumType,
  addChange: AddChange,
) {
  const oldValue = value.oldVersion;
  const newValue = value.newVersion;

  if (isNotEqual(oldValue?.description, newValue.description)) {
    addChange(enumValueDescriptionChanged(newEnum, oldValue, newValue));
  }

  if (isNotEqual(oldValue?.deprecationReason, newValue.deprecationReason)) {
    // @note "No longer supported" is the default graphql reason
    if (
      isVoid(oldValue?.deprecationReason) ||
      oldValue?.deprecationReason === 'No longer supported'
    ) {
      addChange(enumValueDeprecationReasonAdded(newEnum, oldValue, newValue));
    } else if (
      isVoid(newValue.deprecationReason) ||
      newValue?.deprecationReason === 'No longer supported'
    ) {
      addChange(enumValueDeprecationReasonRemoved(newEnum, oldValue, newValue));
    } else {
      addChange(enumValueDeprecationReasonChanged(newEnum, oldValue, newValue));
    }
  }

  compareLists(oldValue?.astNode?.directives || [], newValue.astNode?.directives || [], {
    onAdded(directive) {
      addChange(
        directiveUsageAdded(
          Kind.ENUM_VALUE_DEFINITION,
          directive,
          {
            type: newEnum,
            value: newValue,
          },
          oldValue === null,
        ),
      );
    },
    onRemoved(directive) {
      addChange(
        directiveUsageRemoved(Kind.ENUM_VALUE_DEFINITION, directive, {
          type: newEnum,
          value: oldValue!,
        }),
      );
    },
  });
}
