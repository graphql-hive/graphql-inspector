import { existsSync } from 'fs';
import * as core from '@actions/core';
import { ensureAbsolute } from '@graphql-inspector/commands';
import { DiffRule, Rule } from '@graphql-inspector/core';

export function batch<T>(items: T[], limit: number): T[][] {
  const batches: T[][] = [];
  const batchesNum = Math.ceil(items.length / limit);

  // We still want to update check-run and send empty annotations
  if (batchesNum === 0) {
    return [[]];
  }

  for (let i = 0; i < batchesNum; i++) {
    const start = i * limit;
    const end = start + limit;

    batches.push(items.slice(start, end));
  }

  return batches;
}

/**
 * Treats non-falsy value as true
 */
export function castToBoolean(value: string | boolean, defaultValue?: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === 'false') {
    return value === 'true';
  }

  if (typeof defaultValue === 'boolean') {
    return defaultValue;
  }

  return true;
}

export function getInputAsArray(name: string, options?: core.InputOptions): string[] {
  return core
    .getInput(name, options)
    .split('\n')
    .map(s => s.trim())
    .filter(x => x !== '');
}

export function resolveRule(name: string): Rule | undefined {
  const filepath = ensureAbsolute(name);

  if (existsSync(filepath)) {
    return require(filepath);
  }

  return DiffRule[name as keyof typeof DiffRule];
}
