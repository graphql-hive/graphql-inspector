import {
  expectDiffAndPatchToMatch,
  expectDiffAndPatchToPass,
  expectDiffAndPatchToThrow,
} from './utils.js';

describe('union', () => {
  test('unionMemberAdded', async () => {
    const before = /* GraphQL */ `
      type A {
        foo: String
      }
      type B {
        foo: String
      }
      union U = A
    `;
    const after = /* GraphQL */ `
      type A {
        foo: String
      }
      type B {
        foo: String
      }
      union U = A | B
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('unionMemberAdded: errors if union does not exist', async () => {
    const before = /* GraphQL */ `
      type A {
        foo: String
      }
      type B {
        foo: String
      }
      union U = A
    `;
    const after = /* GraphQL */ `
      type A {
        foo: String
      }
      type B {
        foo: String
      }
      union U = A | B
    `;
    const patchTarget = /* GraphQL */ `
      type A {
        foo: String
      }
      type B {
        foo: String
      }
    `;
    await expectDiffAndPatchToThrow(before, after, patchTarget);
  });

  test('unionMemberRemoved', async () => {
    const before = /* GraphQL */ `
      type A {
        foo: String
      }
      type B {
        foo: String
      }
      union U = A | B
    `;
    const after = /* GraphQL */ `
      type A {
        foo: String
      }
      type B {
        foo: String
      }
      union U = A
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('unionMemberRemoved: ignores already removed union', async () => {
    const before = /* GraphQL */ `
      type A {
        foo: String
      }
      type B {
        foo: String
      }
      union U = A | B
    `;
    const after = /* GraphQL */ `
      type A {
        foo: String
      }
      type B {
        foo: String
      }
      union U = A
    `;
    const patchTarget = /* GraphQL */ `
      type A {
        foo: String
      }
      type B {
        foo: String
      }
    `;
    await expectDiffAndPatchToPass(before, after, patchTarget);
  });
});
