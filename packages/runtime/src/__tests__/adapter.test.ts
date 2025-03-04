import { describe, expect, it, vi } from 'vitest';

import { BaseAdapter, type RuntimeAdapterConfig } from '../adapter';
import type { CompletionResponse, Message } from '../types';

class MockRuntime implements RuntimeBase {
  readonly provider: {
    complete: (
      messages: Message[],
      currentState?: Record<string, unknown>
    ) => Promise<CompletionResponse>;
  };
  readonly messages: Message[];
  readonly debug: boolean;
  readonly currentState?: Record<string, unknown>;

  constructor() {
    this.provider = {
      complete: vi.fn().mockResolvedValue({
        message: 'Test response',
        action: { type: 'test_action' },
      }),
    };
    this.messages = [];
    this.debug = false;
  }

  async query(params: {
    query: string;
    prompt?: string;
    actions?: unknown[];
    currentState?: Record<string, unknown>;
  }): Promise<CompletionResponse> {
    return {
      message: 'Test response',
      action: { type: 'test_action' },
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
    createHandler(config: RuntimeAdapterConfig) {
      const runtime = config.runtime;

      return async function handler(request: any) {
        try {
          const response = await runtime.query(request);
          return response;
        } catch (error) {
          const errorResponse = this.handleError(error);
          return {
            status: errorResponse.status,
            body: errorResponse.body,
          };
        }
      }.bind(this);
    }
  }

  describe('BaseAdapter', () => {
    it('should handle API key errors correctly', () => {
      const adapter = new TestAdapter();
      const error = new Error('Invalid API key or authentication failed');
      const response = adapter.handleError(error);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or missing API key');
      expect(response.body.isConfigured).toBe(false);
    });

    it('should handle rate limit errors correctly', () => {
      const adapter = new TestAdapter();
      const error = new Error('rate limit exceeded');
      const response = adapter.handleError(error);

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Rate limit exceeded');
      expect(response.body.isConfigured).toBe(false);
    });

    it('should handle model access errors correctly', () => {
      const adapter = new TestAdapter();
      const error = new Error('does not have access to model');
      const response = adapter.handleError(error);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Your API key does not have access');
      expect(response.body.isConfigured).toBe(false);
    });

    it('should handle unknown errors correctly', () => {
      const adapter = new TestAdapter();
      const error = new Error('Unknown error');
      const response = adapter.handleError(error);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Unknown error');
      expect(response.body.isConfigured).toBe(false);
    });

    it('should handle non-Error objects correctly', () => {
      const adapter = new TestAdapter();
      const response = adapter.handleError('string error');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Unknown error');
    });
  });

  describe('createHandler', () => {
    it('should create a handler function', () => {
      const adapter = new TestAdapter();
      const handler = adapter.createHandler({ runtime: mockRuntime });
      expect(typeof handler).toBe('function');
    });

    it('should pass runtime configuration to handler', async () => {
      const adapter = new TestAdapter();
      const handler = adapter.createHandler({ runtime: mockRuntime });
      const spy = vi.spyOn(mockRuntime, 'query');

      const request = { query: 'test query' };
      await handler(request);

      expect(spy).toHaveBeenCalledWith(request);
    });

    it('should support custom endpoints', () => {
      const adapter = new TestAdapter();
      const handler = adapter.createHandler({
        runtime: mockRuntime,
        endpoint: '/custom/endpoint',
      });

      expect(handler).toBeDefined();
    });

    it('should handle runtime errors correctly', async () => {
      const errorRuntime = new MockRuntime();
      vi.spyOn(errorRuntime, 'query').mockRejectedValue(new Error('provider error'));

      const adapter = new TestAdapter();
      const handler = adapter.createHandler({ runtime: errorRuntime });

      const response = await handler({ query: 'test' });
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Runtime error');
    });
  });
});
