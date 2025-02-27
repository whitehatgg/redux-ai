import type { Runtime } from '@redux-ai/runtime';
import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExpressAdapter } from '../index';

describe('ExpressAdapter', () => {
  let adapter: ExpressAdapter;
  let mockRuntime: Runtime;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    adapter = new ExpressAdapter();

    mockRuntime = {
      debug: false,
      query: vi.fn().mockImplementation(async () => ({ message: 'Success', action: null })),
    } as unknown as Runtime;

    mockReq = {
      path: '/api/query',
      method: 'POST',
      body: {
        query: 'test query',
        state: {},
        actions: {},
        conversations: '',
      },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  it('should create an express handler', () => {
    const handler = adapter.createHandler({ runtime: mockRuntime });
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should handle successful queries', async () => {
    const expectedResponse = { message: 'Success', action: null };
    mockRuntime.query = vi.fn().mockResolvedValue(expectedResponse);

    const handler = adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRuntime.query).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should pass through non-matching requests', async () => {
    const handler = adapter.createHandler({ runtime: mockRuntime });

    const nonMatchingReq = {
      ...mockReq,
      path: '/different/path',
    };

    await handler(nonMatchingReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRuntime.query).not.toHaveBeenCalled();
  });

  it('should handle API key errors', async () => {
    const error = new Error('Invalid API key or authentication failed');
    mockRuntime.query = vi.fn().mockRejectedValue(error);

    const handler = adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid or missing API key',
      status: 'error',
    });
  });

  it('should handle rate limit errors', async () => {
    const error = new Error('Rate limit exceeded');
    mockRuntime.query = vi.fn().mockRejectedValue(error);

    const handler = adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Rate limit exceeded',
      status: 'error',
    });
  });

  it('should handle unknown errors', async () => {
    const error = new Error('Unknown error');
    mockRuntime.query = vi.fn().mockRejectedValue(error);

    const handler = adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unknown error',
      status: 'error',
    });
  });
});
