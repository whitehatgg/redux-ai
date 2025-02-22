import type { Runtime } from './types';

export interface RuntimeAdapter {
  /**
   * Create a request handler for the given framework (Express, Next.js, etc.)
   */
  createHandler(config: HandlerConfig): unknown;
}

export interface HandlerConfig {
  runtime: Runtime;
  endpoint?: string;
}

// Re-export the Runtime type to ensure consumers get the complete interface
export type { Runtime } from './types';
