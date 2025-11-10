import { fmt, safeString } from '../../src/utils/string.js';

test('scalars', () => {
  expect(safeString(0)).toBe('0');
  expect(safeString(42)).toBe('42');
  expect(safeString(42.42)).toBe('42.42');
  expect(safeString('42')).toBe(`"42"`);
  expect(safeString('true')).toBe(`"true"`);
  expect(safeString(true)).toBe('true');
  expect(safeString('false')).toBe(`"false"`);
  expect(safeString(false)).toBe('false');
});

test('null', () => {
  expect(safeString(null)).toBe('null');
});

test('undefined', () => {
  expect(safeString(undefined)).toBe('undefined');
});

test('object', () => {
  expect(safeString({})).toBe('{}');
  expect(safeString(Object.create(null, { foo: { value: 42, enumerable: true } }))).toBe(
    '{ foo: 42 }',
  );
});

test('array', () => {
  expect(safeString(['42', '42'])).toBe("[ '42', '42' ]");
  expect(safeString([{}])).toBe('[ {} ]');
  expect(safeString([Object.create(null, { foo: { value: 42, enumerable: true } })])).toBe(
    '[ { foo: 42 } ]',
  );
});

describe('fmt', () => {
  test('escapes single quotes in strings', () => {
    expect(fmt("It's a test")).toBe("It\\'s a test");
    expect(fmt("Don't do this")).toBe("Don\\'t do this");
    expect(fmt("'quoted'")).toBe("\\'quoted\\'");
  });

  test('handles strings without single quotes', () => {
    expect(fmt('test')).toBe('test');
    expect(fmt('Old Reason')).toBe('Old Reason');
    expect(fmt('enumA.B')).toBe('enumA.B');
    expect(fmt('')).toBe('');
  });
});
