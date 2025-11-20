import { getReachableTypes } from '../../utils/graphql.js';
import { parsePath } from '../../utils/path.js';
import { CriticalityLevel } from '../changes/change.js';
import { Rule } from './types.js';

export const safeUnreachable: Rule = ({ changes, oldSchema }) => {
  const reachable = oldSchema ? getReachableTypes(oldSchema) : new Set();

  return changes.map(change => {
    if (change.criticality.level === CriticalityLevel.Breaking && change.path) {
      const [typeName] = parsePath(change.path);

      if (!reachable.has(typeName)) {
        return {
          ...change,
          criticality: {
            ...change.criticality,
            level: CriticalityLevel.NonBreaking,
          },
          message: 'Unreachable from root',
        };
      }
    }

    return change;
  });
};
