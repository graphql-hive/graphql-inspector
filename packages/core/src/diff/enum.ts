import { GraphQLEnumType, GraphQLEnumValue, Kind } from 'graphql';
import { compareDirectiveLists, compareLists, isNotEqual, isVoid } from '../utils/compare.js';
import {
  directiveUsageAdded,
  directiveUsageChanged,
  directiveUsageRemoved,
} from './changes/directive-usage.js';
import {
  enumValueAdded,
  enumValueDeprecationReasonAdded,
  enumValueDeprecationReasonChanged,
  enumValueDeprecationReasonRemoved,
  enumValueDescriptionChanged,
  enumValueRemoved,
} from './changes/enum.js';
import { AddChange } from './schema.js';

const DEPRECATION_REASON_DEFAULT = 'No longer supported';

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

  compareDirectiveLists(oldEnum?.astNode?.directives || [], newEnum.astNode?.directives || [], {
    onAdded(directive) {
      addChange(
        directiveUsageAdded(Kind.ENUM_TYPE_DEFINITION, directive, newEnum, oldEnum === null),
      );
      directiveUsageChanged(null, directive, addChange, newEnum);
    },
    onMutual(directive) {
      directiveUsageChanged(directive.oldVersion, directive.newVersion, addChange, newEnum);
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
    if (
      isVoid(oldValue?.deprecationReason) ||
      oldValue?.deprecationReason === DEPRECATION_REASON_DEFAULT
    ) {
      addChange(enumValueDeprecationReasonAdded(newEnum, oldValue, newValue));
    } else if (
      isVoid(newValue.deprecationReason) ||
      newValue?.deprecationReason === DEPRECATION_REASON_DEFAULT
    ) {
      addChange(enumValueDeprecationReasonRemoved(newEnum, oldValue, newValue));
    } else {
      addChange(enumValueDeprecationReasonChanged(newEnum, oldValue, newValue));
    }
  }

  compareDirectiveLists(oldValue?.astNode?.directives || [], newValue.astNode?.directives || [], {
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
      directiveUsageChanged(null, directive, addChange, newEnum, undefined, undefined, newValue);
    },
    onMutual(directive) {
      directiveUsageChanged(
        directive.oldVersion,
        directive.newVersion,
        addChange,
        newEnum,
        undefined,
        undefined,
        newValue,
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
