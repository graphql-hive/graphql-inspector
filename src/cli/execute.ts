import chalk from 'chalk';
import * as logSymbols from 'log-symbols';

import {loadSchema} from '../cli/loaders';
import {renderChange, Renderer, ConsoleRenderer} from '../cli/render';
import {diff} from '../diff/schema';
import {Change, CriticalityLevel} from '../changes/change';

function hasBreaking(changes: Change[]): boolean {
  return changes.some(c => c.criticality.level === CriticalityLevel.Breaking);
}

export async function execute(
  oldSchemaPointer: string,
  newSchemaPointer: string,
  options?: {
    renderer?: Renderer;
  },
) {
  const renderer = (options && options.renderer) || new ConsoleRenderer();

  try {
    const oldSchema = await loadSchema(oldSchemaPointer);
    const newSchema = await loadSchema(newSchemaPointer);

    const changes = diff(oldSchema, newSchema);

    if (!changes.length) {
      renderer.emit(
        logSymbols.success,
        chalk.greenBright('No changes detected'),
      );
    } else {
      renderer.emit(
        `\nDetected the following changes (${
          changes.length
        }) between schemas:\n`,
      );

      changes.forEach(change => {
        renderer.emit(...renderChange(change));
      });

      if (hasBreaking(changes)) {
        renderer.emit(chalk.redBright('\nDetected some breaking changes\n'));
        process.exit(1);
      }
    }
  } catch (e) {
    renderer.emit(logSymbols.error, chalk.redBright(e.message || e));
    process.exit(1);
  }

  process.exit(0);
}
