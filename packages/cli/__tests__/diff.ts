import {resolve} from 'path';
import {diff} from '../src/commands/diff';
import {ConsoleRenderer} from '../src/render';

const oldSchema = resolve(__dirname, './assets/old.graphql');
const newSchema = resolve(__dirname, './assets/new.graphql');

function hasMessage(msg: string) {
  return (args: string[]) => args.join('').indexOf(msg) !== -1;
}

describe('diff', () => {
  const renderer = new ConsoleRenderer();
  let spyProcessExit: jest.SpyInstance;
  let spyProcessCwd: jest.SpyInstance;
  let spyEmit: jest.SpyInstance;
  let spySuccess: jest.SpyInstance;

  beforeEach(() => {
    spyProcessExit = jest.spyOn(process, 'exit');
    spyProcessExit.mockImplementation();

    spyProcessCwd = jest
      .spyOn(process, 'cwd')
      .mockImplementation(() => __dirname);

    spyEmit = jest.spyOn(renderer, 'emit').mockImplementation(() => {});
    spySuccess = jest.spyOn(renderer, 'success').mockImplementation(() => {});
    jest.spyOn(renderer, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    spyProcessExit.mockRestore();
    spyProcessCwd.mockRestore();
  });

  test('should load graphql file', async () => {
    await diff(oldSchema, oldSchema, {
      renderer,
      require: [],
    });

    expect(
      spySuccess.mock.calls.find(hasMessage('No changes detected')),
    ).toBeDefined();

    expect(
      spyEmit.mock.calls.find(hasMessage('Detected the following changes')),
    ).not.toBeDefined();

    expect(spyProcessExit).toHaveBeenCalledWith(0);
  });

  test('should load different schema from graphql file', async () => {
    await diff(oldSchema, newSchema, {
      renderer,
      require: [],
    });

    expect(
      spyEmit.mock.calls.find(hasMessage('No changes detected')),
    ).not.toBeDefined();

    expect(
      spyEmit.mock.calls.find(
        hasMessage('Detected the following changes (4) between schemas:'),
      ),
    ).toBeDefined();

    expect(spyProcessExit).toHaveBeenCalledWith(1);
  });
});
