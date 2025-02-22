import type { Runtime } from './types';

export interface RuntimeAdapter {
  /**
   * Create a request handler for the given framework (Express, Next.js, etc.)
   */
  createHandler(config: { runtime: Runtime; endpoint?: string }): unknown;
}

export interface HandlerConfig {
  runtime: Runtime;
  endpoint?: string;
}
