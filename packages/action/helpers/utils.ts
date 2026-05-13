import { Change, CriticalityLevel } from '@graphql-inspector/core';
import { Endpoint } from './config.js';

export function bolderize(msg: string): string {
  return quotesTransformer(msg, '**');
}

export function quotesTransformer(msg: string, symbols = '**') {
  const findSingleQuotes = /'([^']+)'/gim;
  const findDoubleQuotes = /"([^"]+)"/gim;

  function transformm(_: string, value: string) {
    return `${symbols}${value}${symbols}`;
  }

  return msg.replace(findSingleQuotes, transformm).replace(findDoubleQuotes, transformm);
}

export function slackCoderize(msg: string): string {
  return quotesTransformer(msg, '`');
}

export function discordCoderize(msg: string): string {
  return quotesTransformer(msg, '`');
}

export function filterChangesByLevel(level: CriticalityLevel) {
  return (change: Change) => change.criticality.level === level;
}

export function createSummary(changes: Change[], summaryLimit: number, isLegacyConfig = false) {
  const breakingChanges = changes.filter(filterChangesByLevel(CriticalityLevel.Breaking));
  const dangerousChanges = changes.filter(filterChangesByLevel(CriticalityLevel.Dangerous));
  const safeChanges = changes.filter(filterChangesByLevel(CriticalityLevel.NonBreaking));

  const summary: string[] = [
    `# Found ${changes.length} change${changes.length > 1 ? 's' : ''}`,
    '',
    `Breaking: ${breakingChanges.length}`,
    `Dangerous: ${dangerousChanges.length}`,
    `Safe: ${safeChanges.length}`,
  ];

  if (isLegacyConfig) {
    summary.push(
      [
        '',
        '> Legacy config detected, [please migrate to a new syntax](https://graphql-inspector.com/docs/products/github#full-configuration)',
        '',
      ].join('\n'),
    );
  }

  if (changes.length > summaryLimit) {
    summary.push(
      [
        '',
        `Total amount of changes (${changes.length}) is over the limit (${summaryLimit})`,
        'Adjust it using "summaryLimit" option',
        '',
      ].join('\n'),
    );
  }

  function addChangesToSummary(type: string, changes: Change[]): void {
    if (changes.length <= summaryLimit) {
      summary.push(
        ...['', `## ${type} changes`].concat(
          changes.map(change => ` - ${bolderize(change.message)}`),
        ),
      );
    }

    summaryLimit -= changes.length;
  }

  if (breakingChanges.length) {
    addChangesToSummary('Breaking', breakingChanges);
  }

  if (dangerousChanges.length) {
    addChangesToSummary('Dangerous', dangerousChanges);
  }

  if (safeChanges.length) {
    addChangesToSummary('Safe', safeChanges);
  }

  summary.push(
    [
      '',
      '___',
      `Looking for more advanced tool? Try [GraphQL Hive](https://graphql-hive.com)!`,
    ].join('\n'),
  );

  return summary.join('\n');
}

export function isNil(val: any): val is undefined | null {
  return !val && typeof val !== 'boolean';
}

export function parseEndpoint(endpoint: Endpoint): {
  url: string;
  method: 'GET' | 'get' | 'post' | 'POST';
  headers?: {
    [name: string]: string;
  };
} {
  if (typeof endpoint === 'string') {
    return {
      url: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  return {
    url: endpoint.url,
    method: endpoint.method || 'POST',
    headers: endpoint.headers,
  };
}

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

export function objectFromEntries(iterable: any[]) {
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val;
    return obj;
  }, {});
}
