import { Change } from '@graphql-inspector/core';

export type ErrorHandler = (error: Error) => void;

export interface ActionResult {
  conclusion: CheckConclusion;
  annotations?: Annotation[];
  changes?: Change[];
}

export interface GroupedChanges {
  breaking: Change[];
  dangerous: Change[];
  safe: Change[];
}

export interface Annotation {
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: AnnotationLevel;
  message: string;
  title?: string;
  raw_details?: string;
  start_column?: number;
  end_column?: number;
}

export enum AnnotationLevel {
  Failure = 'failure',
  Warning = 'warning',
  Notice = 'notice',
}

export enum CheckStatus {
  InProgress = 'in_progress',
  Completed = 'completed',
}

export enum CheckConclusion {
  Success = 'success',
  Neutral = 'neutral',
  Failure = 'failure',
}

export interface PullRequest {
  base: { ref: string };
  url: string;
  id: number;
  number: number;
  labels?: Array<{ name: string }>;
}
