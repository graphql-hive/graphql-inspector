import {
  ConstDirectiveNode,
  GraphQLType,
  GraphQLWrappingType,
  isListType,
  isNonNullType,
  isWrappingType,
  Kind,
  NameNode,
  ValueNode,
} from 'graphql';

export function isEqual<T>(a: T, b: T): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    for (let index = 0; index < a.length; index++) {
      if (!isEqual(a[index], b[index])) {
        return false;
      }
    }

    return true;
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;

    const aKeys: string[] = Object.keys(aRecord);
    const bKeys: string[] = Object.keys(bRecord);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!isEqual(aRecord[key], bRecord[key])) {
        return false;
      }
    }

    return true;
  }

  return a === b || (!a && !b);
}

export function isNotEqual<T>(a: T, b: T): boolean {
  return !isEqual(a, b);
}

export function isVoid<T>(a: T): a is T & (null | undefined) {
  return typeof a === 'undefined' || a === null;
}

export function diffArrays<T>(a: T[] | readonly T[], b: T[] | readonly T[]): T[] {
  return a.filter(c => !b.some(d => isEqual(d, c)));
}

function extractName(name: string | NameNode): string {
  if (typeof name === 'string') {
    return name;
  }

  return name.value;
}

export function compareLists<T extends { name: string | NameNode }>(
  oldList: readonly T[],
  newList: readonly T[],
  callbacks?: {
    onAdded?(t: T): void;
    onRemoved?(t: T): void;
    onMutual?(t: { newVersion: T; oldVersion: T | null }): void;
  },
) {
  // Fast path: same names in the same order means every item pairs up by position.
  if (oldList.length === newList.length) {
    let sameOrder = true;
    for (let i = 0; i < oldList.length; i++) {
      if (extractName(oldList[i].name) !== extractName(newList[i].name)) {
        sameOrder = false;
        break;
      }
    }
    if (sameOrder) {
      const mutual: Array<{ newVersion: T; oldVersion: T }> = [];
      for (let i = 0; i < oldList.length; i++) {
        mutual.push({ newVersion: newList[i], oldVersion: oldList[i] });
      }
      if (callbacks?.onMutual) {
        for (const item of mutual) {
          callbacks.onMutual(item);
        }
      }
      return { added: [] as T[], removed: [] as T[], mutual };
    }
  }

  const oldMap = new Map<string, T>();
  for (const oldItem of oldList) {
    oldMap.set(extractName(oldItem.name), oldItem);
  }
  const newMap = new Map<string, T>();
  for (const newItem of newList) {
    newMap.set(extractName(newItem.name), newItem);
  }

  const added: T[] = [];
  const removed: T[] = [];
  const mutual: Array<{ newVersion: T; oldVersion: T }> = [];

  for (const oldItem of oldList) {
    const newItem = newMap.get(extractName(oldItem.name));
    if (newItem === undefined) {
      removed.push(oldItem);
    } else {
      mutual.push({
        newVersion: newItem,
        oldVersion: oldItem,
      });
    }
  }

  for (const newItem of newList) {
    if (!oldMap.has(extractName(newItem.name))) {
      added.push(newItem);
    }
  }

  if (callbacks) {
    if (callbacks.onRemoved) {
      for (const item of removed) {
        callbacks.onRemoved(item);
      }
    }
    if (callbacks.onAdded) {
      for (const item of added) {
        callbacks.onAdded(item);
      }
    }
    if (callbacks.onMutual) {
      for (const item of mutual) {
        callbacks.onMutual(item);
      }
    }
  }

  return {
    added,
    removed,
    mutual,
  };
}

/**
 * This is special because directives can be repeated and a name alone is not enough
 * to identify whether or not an instance was changed, added, or removed.
 * The best option is to assume the order is the same, and treat the changes as they come.
 * So `type T @foo` to `type T @foo(f: 'bar') @foo` would be adding an argument `f: 'bar'` and
 * then adding a new directive `@foo`. Rather than adding `@foo(f: 'bar')`
 */
export function compareDirectiveLists<T extends { name: string | NameNode }>(
  oldList: readonly T[],
  newList: readonly T[],
  callbacks?: {
    onAdded?(t: T): void;
    onRemoved?(t: T): void;
    onMutual?(t: { newVersion: T; oldVersion: T | null }): void;
  },
) {
  // Fast path: same directive names in the same order means every usage pairs up by position.
  if (oldList.length === newList.length) {
    let sameOrder = true;
    for (let i = 0; i < oldList.length; i++) {
      if (extractName(oldList[i].name) !== extractName(newList[i].name)) {
        sameOrder = false;
        break;
      }
    }
    if (sameOrder) {
      const mutual: Array<{ newVersion: T; oldVersion: T }> = [];
      for (let i = 0; i < oldList.length; i++) {
        mutual.push({ newVersion: newList[i], oldVersion: oldList[i] });
      }
      if (callbacks?.onMutual) {
        for (const item of mutual) {
          callbacks.onMutual(item);
        }
      }
      return { added: [] as T[], removed: [] as T[], mutual };
    }
  }

  // Directives with the same name are matched by position: the n-th old `@foo` is paired with
  // the n-th new `@foo`. Extra old usages are removed, extra new usages are added.
  const newByName = new Map<string, T[]>();
  for (const newItem of newList) {
    const name = extractName(newItem.name);
    const items = newByName.get(name);
    if (items) {
      items.push(newItem);
    } else {
      newByName.set(name, [newItem]);
    }
  }

  const added: T[] = [];
  const removed: T[] = [];
  const mutual: Array<{ newVersion: T; oldVersion: T }> = [];

  const oldCounts = new Map<string, number>();
  for (const oldItem of oldList) {
    const name = extractName(oldItem.name);
    const index = oldCounts.get(name) ?? 0;
    oldCounts.set(name, index + 1);
    const newItem = newByName.get(name)?.[index];
    if (newItem === undefined) {
      removed.push(oldItem);
    } else {
      mutual.push({ newVersion: newItem, oldVersion: oldItem });
    }
  }

  const newCounts = new Map<string, number>();
  for (const newItem of newList) {
    const name = extractName(newItem.name);
    const index = newCounts.get(name) ?? 0;
    newCounts.set(name, index + 1);
    if (index >= (oldCounts.get(name) ?? 0)) {
      added.push(newItem);
    }
  }

  if (callbacks) {
    if (callbacks.onRemoved) {
      for (const item of removed) {
        callbacks.onRemoved(item);
      }
    }
    if (callbacks.onAdded) {
      for (const item of added) {
        callbacks.onAdded(item);
      }
    }
    if (callbacks.onMutual) {
      for (const item of mutual) {
        callbacks.onMutual(item);
      }
    }
  }

  return {
    added,
    removed,
    mutual,
  };
}

/**
 * Structural equality for GraphQL value AST nodes.
 * Equivalent to `print(a) === print(b)`, but without serializing either side,
 * and short-circuits on the first difference.
 */
export function isValueNodeEqual(a: ValueNode, b: ValueNode): boolean {
  if (a === b) {
    return true;
  }
  if (a.kind !== b.kind) {
    return false;
  }
  switch (a.kind) {
    case Kind.NULL:
      return true;
    case Kind.INT:
    case Kind.FLOAT:
    case Kind.BOOLEAN:
    case Kind.ENUM:
      return a.value === (b as typeof a).value;
    case Kind.STRING:
      // block and regular strings print differently
      return a.value === (b as typeof a).value && !!a.block === !!(b as typeof a).block;
    case Kind.VARIABLE:
      return a.name.value === (b as typeof a).name.value;
    case Kind.LIST: {
      const bValues = (b as typeof a).values;
      if (a.values.length !== bValues.length) {
        return false;
      }
      for (let i = 0; i < a.values.length; i++) {
        if (!isValueNodeEqual(a.values[i], bValues[i])) {
          return false;
        }
      }
      return true;
    }
    case Kind.OBJECT: {
      // field order is significant for print(), so compare positionally
      const bFields = (b as typeof a).fields;
      if (a.fields.length !== bFields.length) {
        return false;
      }
      for (let i = 0; i < a.fields.length; i++) {
        if (
          a.fields[i].name.value !== bFields[i].name.value ||
          !isValueNodeEqual(a.fields[i].value, bFields[i].value)
        ) {
          return false;
        }
      }
      return true;
    }
  }
}

/**
 * Equivalent to `a.toString() === b.toString()` for GraphQL type references
 * (e.g. `[String!]!`), without building the strings.
 */
export function isTypeRefEqual(a: GraphQLType, b: GraphQLType): boolean {
  while (isWrappingType(a)) {
    // both sides must have the same wrapper (NonNull or List) at this level
    if (isNonNullType(a) ? !isNonNullType(b) : !isListType(b)) {
      return false;
    }
    a = a.ofType;
    b = (b as GraphQLWrappingType).ofType;
  }
  return !isWrappingType(b) && a.name === b.name;
}

/**
 * Whether a directive usage is unchanged: same name and the same arguments,
 * in the same order, with the same values.
 */
export function isDirectiveNodeEqual(a: ConstDirectiveNode, b: ConstDirectiveNode): boolean {
  if (a.name.value !== b.name.value) {
    return false;
  }
  const aArgs = a.arguments ?? [];
  const bArgs = b.arguments ?? [];
  if (aArgs.length !== bArgs.length) {
    return false;
  }
  for (let i = 0; i < aArgs.length; i++) {
    if (
      aArgs[i].name.value !== bArgs[i].name.value ||
      !isValueNodeEqual(aArgs[i].value, bArgs[i].value)
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Whether two lists of directive usages are unchanged, compared by position.
 */
export function isDirectiveListEqual(
  a: readonly ConstDirectiveNode[] | undefined,
  b: readonly ConstDirectiveNode[] | undefined,
): boolean {
  const aList = a ?? [];
  const bList = b ?? [];
  if (aList.length !== bList.length) {
    return false;
  }
  for (let i = 0; i < aList.length; i++) {
    if (!isDirectiveNodeEqual(aList[i], bList[i])) {
      return false;
    }
  }
  return true;
}
