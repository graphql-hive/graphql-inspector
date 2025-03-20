import jsesc from 'jsesc';
import stripAnsi from 'strip-ansi';
import type { MockInstance } from 'vitest';

function nonTTY(msg: string) {
  return stripAnsi(jsesc(stripAnsi(msg)));
}

expect.extend({
  toHaveBeenCalledNormalized(spy: MockInstance, expected: string) {
    const normalizedExpected = nonTTY(expected);
    const calls = spy.mock.calls;
    const contain = calls.some(args => nonTTY(args.join(' ')).includes(normalizedExpected));

    if (contain) {
      return {
        message: () => `expected not to be a called with ${expected}`,
        pass: true,
      };
    }
    const message = `expected to be called with ${expected}`;

    return {
      message: () => message,
      pass: false,
    };
  },
});
