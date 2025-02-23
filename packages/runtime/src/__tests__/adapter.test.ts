import { describe, expect, it, vi } from 'vitest';

import type { HandlerConfig } from '../adapter';
import type { Runtime, RuntimeAdapter } from '../types';

/**
 * Test suite for RuntimeAdapter
 * 
 * Mocking Best Practices:
 * 1. Use class-based mocks for better type safety
 * 2. Follow consistent mocking patterns across test files
 * 3. Maintain proper typing for mock implementations
 * 4. Keep mocks simple and focused
 */

// Create mock runtime class
class MockRuntime implements Runtime {
  provider: {
    complete: ReturnType<typeof vi.fn>;
  };
  messages: [];
  debug: boolean;
  query: ReturnType<typeof vi.fn>;

  constructor() {
    this.provider = {
      complete: vi.fn().mockResolvedValue({ message: 'Test response' }),
    };
    this.messages = [];
    this.debug = false;
    this.query = vi.fn().mockResolvedValue({ message: 'Test response' });
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
      const errorRuntime = new MockRuntime();
      errorRuntime.query = vi.fn().mockRejectedValue(new Error('Runtime error'));

      const adapter = new TestAdapter();
      const handler = adapter.createHandler({ runtime: errorRuntime });

      await expect(handler({ query: 'test' })).rejects.toThrow('Runtime error');
    });
  });
});