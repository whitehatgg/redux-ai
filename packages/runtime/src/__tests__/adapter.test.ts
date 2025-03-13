import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BaseAdapter, type RuntimeAdapterConfig } from '../adapter';
import type { CompletionResponse, Message, QueryParams, RuntimeBase } from '../types';

class MockRuntime implements RuntimeBase {
  readonly debug: boolean = false;

  async query(params: QueryParams): Promise<CompletionResponse> {
    return {
      message: 'Test response',
      action: { type: 'test_action' },
      reasoning: ['Test reasoning'],
      intent: 'action'
    };
  }
}

describe('RuntimeAdapter', () => {
  let mockRuntime: RuntimeBase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRuntime = new MockRuntime();
  });

  class TestAdapter extends BaseAdapter {
    async createHandler(config: RuntimeAdapterConfig) {
      const runtime = config.runtime;

      async function handler(request: any) {
        try {
          const response = await runtime.query(request);
          return response;
        } catch (error) {
          const errorResult = this.handleError(error);
          return {
            status: errorResult.status,
            body: errorResult.body,
          };
        }
      }

      return handler.bind(this);
    }
  }

  describe('BaseAdapter', () => {
    it('should pass through API key errors with 401 status', () => {
      const adapter = new TestAdapter();
      const error = new Error('Invalid API key or authentication failed');
      const response = adapter.handleError(error);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid API key or authentication failed');
      expect(response.body.status).toBe('error');
    });

    it('should pass through rate limit errors with 429 status', () => {
      const adapter = new TestAdapter();
      const error = new Error('rate limit exceeded');
      const response = adapter.handleError(error);

      expect(response.status).toBe(429);
      expect(response.body.error).toBe('rate limit exceeded');
      expect(response.body.status).toBe('error');
    });

    it('should pass through model access errors with 500 status', () => {
      const adapter = new TestAdapter();
      const error = new Error('does not have access to model');
      const response = adapter.handleError(error);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('does not have access to model');
      expect(response.body.status).toBe('error');
    });

    it('should handle unknown errors with 500 status', () => {
      const adapter = new TestAdapter();
      const error = new Error('Unknown error');
      const response = adapter.handleError(error);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Unknown error');
      expect(response.body.status).toBe('error');
    });

    it('should handle non-Error objects with 500 status', () => {
      const adapter = new TestAdapter();
      const response = adapter.handleError('string error');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('string error');
      expect(response.body.status).toBe('error');
    });
  });

  describe('createHandler', () => {
    it('should create a handler function', async () => {
      const adapter = new TestAdapter();
      const handler = await adapter.createHandler({ runtime: mockRuntime });
      expect(typeof handler).toBe('function');
    });

    it('should pass runtime configuration to handler', async () => {
      const adapter = new TestAdapter();
      const handler = await adapter.createHandler({ runtime: mockRuntime });
      const spy = vi.spyOn(mockRuntime, 'query');

      const request = { query: 'test query' };
      await handler(request);

      expect(spy).toHaveBeenCalledWith(request);
    });

    it('should handle runtime errors correctly', async () => {
      const errorRuntime = new MockRuntime();
      vi.spyOn(errorRuntime, 'query').mockRejectedValue(new Error('runtime error'));

      const adapter = new TestAdapter();
      const handler = await adapter.createHandler({ runtime: errorRuntime });

      const response = await handler({ query: 'test' });
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('runtime error');
    });
  });
});