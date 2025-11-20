import { isEnumType, isInputObjectType, isInterfaceType, isObjectType } from 'graphql';
import { isDeprecated } from '../../utils/is-deprecated.js';
import { parsePath } from '../../utils/path.js';
import { ChangeType, CriticalityLevel } from '../changes/change.js';
import { Rule } from './types.js';

export const suppressRemovalOfDeprecatedField: Rule = ({ changes, oldSchema, newSchema }) => {
  return changes.map(change => {
    if (
      change.type === ChangeType.FieldRemoved &&
      change.criticality.level === CriticalityLevel.Breaking &&
      change.path
    ) {
      const [typeName, fieldName] = parsePath(change.path);
      const type = oldSchema?.getType(typeName);

      if (isObjectType(type) || isInterfaceType(type)) {
        const field = type.getFields()[fieldName];

        if (isDeprecated(field)) {
          return {
            ...change,
            criticality: {
              ...change.criticality,
              level: CriticalityLevel.Dangerous,
            },
          };
        }
      }
    }

    if (
      change.type === ChangeType.EnumValueRemoved &&
      change.criticality.level === CriticalityLevel.Breaking &&
      change.path
    ) {
      const [enumName, enumItem] = parsePath(change.path);
      const type = oldSchema?.getType(enumName);

      if (isEnumType(type)) {
        const item = type.getValue(enumItem);

        if (item && isDeprecated(item)) {
          return {
            ...change,
            criticality: {
              ...change.criticality,
              level: CriticalityLevel.Dangerous,
            },
          };
        }
      }
    }

    if (
      change.type === ChangeType.InputFieldRemoved &&
      change.criticality.level === CriticalityLevel.Breaking &&
      change.path
    ) {
      const [inputName, inputItem] = parsePath(change.path);
      const type = oldSchema?.getType(inputName);

      if (isInputObjectType(type)) {
        const item = type.getFields()[inputItem];

        if (item && isDeprecated(item)) {
          return {
            ...change,
            criticality: {
              ...change.criticality,
              level: CriticalityLevel.Dangerous,
            },
          };
        }
      }
    }

    if (
      change.type === ChangeType.TypeRemoved &&
      change.criticality.level === CriticalityLevel.Breaking &&
      change.path
    ) {
      const [typeName] = parsePath(change.path);
      const type = newSchema?.getType(typeName);

      if (!type) {
        return {
          ...change,
          criticality: {
            ...change.criticality,
            level: CriticalityLevel.Dangerous,
          },
        };
      }
    }

    return change;
  });
};
