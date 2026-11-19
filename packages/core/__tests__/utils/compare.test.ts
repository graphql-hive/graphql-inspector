import { buildSchema, parseValue, print } from 'graphql';
import {
  compareDirectiveLists,
  diffArrays,
  isEqual,
  isNotEqual,
  isTypeRefEqual,
  isValueNodeEqual,
} from '../../src/utils/compare.js';

test('isEqual', () => {
  expect(isEqual('a', 'a')).toBe(true);
  expect(isEqual('a', 'b')).toBe(false);

  expect(isEqual(1, 1)).toBe(true);
  expect(isEqual(1, 1.0)).toBe(true);

  expect(isEqual(undefined, 1)).toBe(false);
  expect(isEqual(null, 1)).toBe(false);
  expect(isEqual(null, null)).toBe(true);

  expect(isEqual(['a'], ['a'])).toBe(true);
  expect(isEqual(['a'], ['A'])).toBe(false);
  expect(isEqual(['a'], [''])).toBe(false);
  expect(isEqual(['a'], ['aa'])).toBe(false);

  expect(isEqual([{ test: 'a' }], [{ test: 'a' }])).toBe(true);
  expect(isEqual([{ test: 'a' }], [{ test: 'b' }])).toBe(false);
  expect(isEqual([{ test: { deep: 'a' } }], [{ test: { deep: 'a' } }])).toBe(true);
  expect(isEqual([{ test: { deep: 'a' } }], [{ test: { deep: 'b' } }])).toBe(false);
  expect(isEqual([{ test: { deep: 'a' } }], [{ test: { deeper: 'a' } }])).toBe(false);
  expect(isEqual([{ test: { deep: 'a' } }], [{ test: { deep: 'a', twoKeys: 'b' } }])).toBe(false);
  expect(isEqual([{ test: { deep: 'a', twoKeys: 'b' } }], [{ test: { deep: 'a' } }])).toBe(false);
});

test('isNotEqual', () => {
  expect(isNotEqual('a', 'a')).toBe(false);
  expect(isNotEqual('a', 'b')).toBe(true);
});

test('diffArrays', () => {
  expect(diffArrays(['a'], ['a'])).toEqual([]);
  expect(diffArrays(['a'], ['a', 'b'])).toEqual([]);
  expect(diffArrays(['a', 'b'], ['a'])).toEqual(['b']);
  expect(diffArrays(['a', { test: { deep: 'b' } }], [{ test: { deep: 'c' } }])).toEqual([
    'a',
    { test: { deep: 'b' } },
  ]);
  expect(diffArrays(['a', { test: { deep: 'b' } }], [{ test: { deep: 'b' } }])).toEqual(['a']);
});

describe('isValueNodeEqual', () => {
  const cases = [
    '1',
    '2',
    '1.0',
    '1.5',
    'true',
    'false',
    'null',
    'FOO',
    'BAR',
    '$var',
    '$other',
    '"abc"',
    '"abd"',
    '"""abc"""',
    '""',
    '[]',
    '[1, 2]',
    '[2, 1]',
    '[1, 2, 3]',
    '{}',
    '{ a: 1, b: 2 }',
    '{ b: 2, a: 1 }',
    '{ a: 1, b: 3 }',
    '{ a: 1, c: 2 }',
    '{ a: [{ x: "y" }] }',
    '{ a: [{ x: "z" }] }',
  ].map(source => parseValue(source));

  test('matches print() equality for every pair', () => {
    for (const a of cases) {
      for (const b of cases) {
        expect(isValueNodeEqual(a, b)).toBe(print(a) === print(b));
      }
    }
  });

  test('ignores source locations', () => {
    expect(isValueNodeEqual(parseValue('{ a:   [1,2] }'), parseValue('{a:[1, 2]}'))).toBe(true);
  });
});

describe('compareDirectiveLists', () => {
  const names = (list: Array<{ name: string }>) => list.map(item => item.name);
  const ids = (list: Array<{ id: number }>) => list.map(item => item.id);

  test('pairs identical lists by position', () => {
    const oldList = [
      { name: 'a', id: 1 },
      { name: 'b', id: 2 },
      { name: 'a', id: 3 },
    ];
    const newList = [
      { name: 'a', id: 4 },
      { name: 'b', id: 5 },
      { name: 'a', id: 6 },
    ];
    const result = compareDirectiveLists(oldList, newList);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.mutual.map(m => [m.oldVersion.id, m.newVersion.id])).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
  });

  test('matches the n-th usage of a name and keeps schema order for added and removed', () => {
    const oldList = [
      { name: 'a', id: 1 },
      { name: 'c', id: 2 },
      { name: 'c', id: 3 },
    ];
    const newList = [
      { name: 'b', id: 4 },
      { name: 'a', id: 5 },
      { name: 'c', id: 6 },
      { name: 'a', id: 7 },
    ];
    const result = compareDirectiveLists(oldList, newList);
    expect(ids(result.added)).toEqual([4, 7]);
    expect(names(result.added)).toEqual(['b', 'a']);
    expect(ids(result.removed)).toEqual([3]);
    expect(result.mutual.map(m => [m.oldVersion.id, m.newVersion.id])).toEqual([
      [1, 5],
      [2, 6],
    ]);
  });
});

describe('isTypeRefEqual', () => {
  test('matches toString() equality', () => {
    const schema = buildSchema(/* GraphQL */ `
      type Query {
        a: String
        b: String!
        c: [String]
        d: [String!]
        e: [String]!
        f: [String!]!
        g: [[String]]
        h: Int
      }
    `);
    const types = Object.values(schema.getQueryType()!.getFields()).map(field => field.type);
    for (const a of types) {
      for (const b of types) {
        expect(isTypeRefEqual(a, b)).toBe(a.toString() === b.toString());
      }
    }
  });
});
