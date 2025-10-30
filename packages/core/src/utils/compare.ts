import { NameNode } from 'graphql';

export function keyMap<T>(list: readonly T[], keyFn: (item: T) => string): Record<string, T> {
  return list.reduce((map, item) => {
    map[keyFn(item)] = item;
    return map;
  }, Object.create(null));
}

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
  const oldMap = keyMap(oldList, ({ name }) => extractName(name));
  const newMap = keyMap(newList, ({ name }) => extractName(name));

  const added: T[] = [];
  const removed: T[] = [];
  const mutual: Array<{ newVersion: T; oldVersion: T }> = [];

  for (const oldItem of oldList) {
    const newItem = newMap[extractName(oldItem.name)] ?? null;
    if (newItem === null) {
      removed.push(oldItem);
    } else {
      mutual.push({
        newVersion: newItem,
        oldVersion: oldItem ?? null,
      });
    }
  }

  for (const newItem of newList) {
    if (oldMap[extractName(newItem.name)] === undefined) {
      added.push(newItem);
    }
  }

  if (callbacks) {
    if (callbacks.onAdded) {
      for (const item of added) {
        callbacks.onAdded(item);
      }
    }
    if (callbacks.onRemoved) {
      for (const item of removed) {
        callbacks.onRemoved(item);
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
  const oldMap = keyMapList(oldList, ({ name }) => extractName(name));
  const newMap = keyMapList(newList, ({ name }) => extractName(name));

  const added: T[] = [];
  const removed: T[] = [];
  const mutual: Array<{ newVersion: T; oldVersion: T }> = [];

  for (const oldItem of oldList) {
    // check if the oldItem exists in the new schema
    const newItems = newMap[extractName(oldItem.name)] ?? null;
    // if not, then it's been removed
    if (newItems === null) {
      removed.push(oldItem);
    } else {
      // if so, then consider this a mutual change, and remove it from the list of newItems to avoid counting it in the future
      const [newItem, ...rest] = newItems;
      if (rest.length > 1) {
        newMap[extractName(oldItem.name)] = rest as [T] & T[];
      } else {
        delete newMap[extractName(oldItem.name)];
      }

      mutual.push({
        newVersion: newItem,
        oldVersion: oldItem ?? null,
      });
    }
  }

  for (const newItem of newList) {
    const existingItems = oldMap[extractName(newItem.name)] ?? null;
    if (existingItems === null) {
      added.push(newItem);
    } else {
      const [_, ...rest] = existingItems;
      if (rest.length > 0) {
        oldMap[extractName(newItem.name)] = rest as [T] & T[];
      } else {
        delete oldMap[extractName(newItem.name)];
      }
    }
  }

  if (callbacks) {
    if (callbacks.onAdded) {
      for (const item of added) {
        callbacks.onAdded(item);
      }
    }
    if (callbacks.onRemoved) {
      for (const item of removed) {
        callbacks.onRemoved(item);
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

export function keyMapList<T>(
  list: readonly T[],
  keyFn: (item: T) => string,
): Record<string, [T] & T[]> {
  return list.reduce((map, item) => {
    const key = keyFn(item);
    map[key] = [...(map[key] ?? []), item];
    return map;
  }, Object.create(null));
}
