import { BaseAdapter } from '@redux-ai/runtime';
import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExpressAdapter } from '../index';

describe('ExpressAdapter', () => {
  let adapter: ExpressAdapter;
  let mockRuntime: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    adapter = new ExpressAdapter();

    mockRuntime = {
      debug: false,
      query: vi.fn().mockImplementation(async () => ({ 
        message: 'Success', 
        action: null,
        intent: 'action',
        reasoning: ['Test reasoning']
      })),
    };

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

  it('should create an express handler', async () => {
    const handler = await adapter.createHandler({ runtime: mockRuntime });
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should pass through successful queries', async () => {
    const expectedResponse = { 
      message: 'Success', 
      action: null,
      intent: 'action',
      reasoning: ['Test reasoning']
    };
    mockRuntime.query = vi.fn().mockResolvedValue(expectedResponse);

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRuntime.query).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should pass through non-matching requests', async () => {
    const handler = await adapter.createHandler({ runtime: mockRuntime });

    const nonMatchingReq = {
      ...mockReq,
      path: '/different/path',
    };

    await handler(nonMatchingReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRuntime.query).not.toHaveBeenCalled();
  });

  it('should pass through API key errors', async () => {
    const errorMessage = 'Invalid API key or authentication failed';
    mockRuntime.query = vi.fn().mockRejectedValue(new Error(errorMessage));

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: errorMessage,
      status: 'error'
    });
  });

  it('should pass through rate limit errors', async () => {
    const errorMessage = 'Rate limit exceeded';
    mockRuntime.query = vi.fn().mockRejectedValue(new Error(errorMessage));

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: errorMessage,
      status: 'error'
    });
  });

  it('should pass through unknown errors', async () => {
    const errorMessage = 'Unknown error occurred';
    mockRuntime.query = vi.fn().mockRejectedValue(new Error(errorMessage));

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: errorMessage,
      status: 'error'
    });
  });
});