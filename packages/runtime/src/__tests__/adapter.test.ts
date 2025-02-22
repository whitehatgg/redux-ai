import { describe, expect, it, vi } from 'vitest';

import type { HandlerConfig } from '../adapter';
import type { Runtime, RuntimeAdapter } from '../types';

describe('RuntimeAdapter', () => {
  const mockRuntime: Runtime = {
    provider: {
      complete: vi.fn().mockResolvedValue({ message: 'Test response' }),
    },
    messages: [],
    debug: false,
    query: vi.fn().mockResolvedValue({ message: 'Test response' }),
  };

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

      const request = { query: 'test query' };
      await handler(request);

      expect(mockRuntime.query).toHaveBeenCalledWith(request);
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
      const errorRuntime: Runtime = {
        ...mockRuntime,
        query: vi.fn().mockRejectedValue(new Error('Runtime error')),
      };

      const adapter = new TestAdapter();
      const handler = adapter.createHandler({ runtime: errorRuntime });

      await expect(handler({ query: 'test' })).rejects.toThrow('Runtime error');
    });
  });
});
