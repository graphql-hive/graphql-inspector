import { expectPatchToMatch } from './utils.js';

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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
  });
});
