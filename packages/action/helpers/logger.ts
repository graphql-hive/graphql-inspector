import type { Context } from 'probot';

export interface Logger {
  log(msg: string): void;
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string | Error, error?: Error): void;
}

export function createLogger(label: string, context: Context, release: string): Logger {
  const id = Math.random().toString(16).substr(2, 5);
  const prefix = (msg: string) => `${label} ${id} - release-${release.substr(0, 7)} : ${msg}`;

  return {
    log(msg: string) {
      context.log.info(prefix(msg));
    },
    info(msg: string) {
      context.log.info(prefix(msg));
    },
    warn(msg: string) {
      context.log.warn(prefix(msg));
    },
    error(msg: string | Error, error?: any) {
      if (error) {
        console.error(error);
      }

      context.log.error(prefix(msg instanceof Error ? msg.message : msg));
    },
  };
}
