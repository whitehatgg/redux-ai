import { describe, expect, it, vi } from 'vitest';

import type { HandlerConfig } from '../adapter';
import type { CompletionResponse, Message, Runtime, RuntimeAdapter } from '../types';

class MockRuntime implements Runtime {
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
  let mockRuntime: Runtime;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRuntime = new MockRuntime();
  });

  class TestAdapter implements RuntimeAdapter {
    createHandler(config: HandlerConfig) {
      return async (request: any) => {
        const response = await config.runtime.query(request);
        return response;
      };
    }
  }

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

    it('should handle runtime errors', async () => {
      const errorRuntime = new MockRuntime();
      vi.spyOn(errorRuntime, 'query').mockRejectedValue(new Error('Runtime error'));

      const adapter = new TestAdapter();
      const handler = adapter.createHandler({ runtime: errorRuntime });

      await expect(handler({ query: 'test' })).rejects.toThrow('Runtime error');
    });
  });
});
