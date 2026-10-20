import { GraphQLSchema, Source } from 'graphql';
import * as core from '@actions/core';
import { Change, CriticalityLevel, diff as diffSchemas, Rule } from '@graphql-inspector/core';
import { fetch } from '@whatwg-node/fetch';
import { getLocationByPath } from './location.js';
import {
  ActionResult,
  Annotation,
  AnnotationLevel,
  CheckConclusion,
  PullRequest,
} from './types.js';
import { isNil, parseEndpoint } from './utils.js';

export type DiffInterceptor =
  | string
  | {
      url: string;
      headers?: {
        [header: string]: string;
      };
    };

export interface DiffInterceptorPayload {
  pullRequests?: PullRequest[];
  ref?: string;
  changes: Change[];
}

export type DiffInterceptorResponse = {
  changes: Change[];
  conclusion?: CheckConclusion;
};

export async function diff({
  path,
  schemas,
  sources,
  interceptor,
  pullRequests,
  ref,
  rules,
  config,
}: {
  path: string;
  schemas: {
    old: GraphQLSchema;
    new: GraphQLSchema;
  };
  sources: {
    old: Source;
    new: Source;
  };
  interceptor?: DiffInterceptor;
  pullRequests?: PullRequest[];
  ref?: string;
  rules?: Rule[];
  config?: Parameters<typeof diffSchemas>[3];
}): Promise<ActionResult> {
  let changes = await diffSchemas(schemas.old, schemas.new, rules, config, {
    onWarning: warning => core.warning(warning.message),
  });
  let forcedConclusion: CheckConclusion | null = null;

  if (!changes?.length) {
    return {
      conclusion: CheckConclusion.Success,
    };
  }

  if (!isNil(interceptor)) {
    const interceptionResult = await interceptChanges(interceptor, {
      pullRequests,
      ref,
      changes,
    });

    changes = interceptionResult.changes || [];
    forcedConclusion = interceptionResult.conclusion || null;
  }

  const annotations = await Promise.all(
    changes.map(change => annotate({ path, change, source: sources.new })),
  );
  let conclusion: CheckConclusion = CheckConclusion.Success;

  if (changes.some(change => change.criticality.level === CriticalityLevel.Breaking)) {
    conclusion = CheckConclusion.Failure;
  }

  if (forcedConclusion) {
    conclusion = forcedConclusion;
  }

  return {
    conclusion,
    annotations,
    changes,
  };
}

const levelMap = {
  [CriticalityLevel.Breaking]: AnnotationLevel.Failure,
  [CriticalityLevel.Dangerous]: AnnotationLevel.Warning,
  [CriticalityLevel.NonBreaking]: AnnotationLevel.Notice,
};

function annotate({
  path,
  change,
  source,
}: {
  path: string;
  change: Change;
  source: Source;
}): Annotation {
  const level = change.criticality.level;
  const loc = change.path
    ? getLocationByPath({ path: change.path, source })
    : { line: 1, column: 1 };

  return {
    title: change.message,
    annotation_level: levelMap[level],
    path,
    message: change.criticality.reason || change.message,
    start_line: loc.line,
    end_line: loc.line,
  };
}

async function interceptChanges(
  interceptor: DiffInterceptor,
  payload: DiffInterceptorPayload,
): Promise<DiffInterceptorResponse> {
  const endpoint = parseEndpoint(interceptor);

  const response = await fetch(endpoint.url, {
    method: endpoint.method,
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  return data;
}
