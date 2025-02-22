import type { Runtime } from '@redux-ai/runtime';
import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHandler, ExpressAdapter } from '../index';

describe('ExpressAdapter', () => {
  let mockRuntime: Runtime;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock runtime with proper typing
    mockRuntime = {
      query: vi.fn().mockImplementation(async () => ({ message: 'Success' })),
      debug: false,
    };

    // Mock Express request
    mockReq = {
      path: '/api/query',
      method: 'POST',
      body: {
        query: 'test query',
        prompt: 'test prompt',
        actions: [],
        currentState: {},
      },
    };

    // Mock Express response
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create an express handler', () => {
    const adapter = new ExpressAdapter();
    const handler = adapter.createHandler({ runtime: mockRuntime });
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should handle successful queries', async () => {
    const expectedResponse = { message: 'Success', data: {} };
    mockRuntime.query = vi.fn().mockResolvedValue(expectedResponse);

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRuntime.query).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should pass through non-matching requests', async () => {
    const handler = createHandler({ runtime: mockRuntime });

    const nonMatchingReq = {
      ...mockReq,
      path: '/different/path',
    };

    await handler(nonMatchingReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRuntime.query).not.toHaveBeenCalled();
  });

  it('should handle API key errors', async () => {
    const error = new Error('Invalid API key');
    mockRuntime.query = vi.fn().mockRejectedValue(error);

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid or missing API key. Please check your configuration.',
      isConfigured: false,
    });
  });

  it('should handle rate limit errors', async () => {
    const error = new Error('rate limit exceeded');
    mockRuntime.query = vi.fn().mockRejectedValue(error);

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Rate limit exceeded. Please try again later.',
    });
  });

  it('should handle model access errors', async () => {
    const error = new Error('does not have access to model');
    mockRuntime.query = vi.fn().mockRejectedValue(error);

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Your API key does not have access to the required model.',
      isConfigured: false,
    });
  });

  it('should handle unknown errors', async () => {
    const error = new Error('Unknown error');
    mockRuntime.query = vi.fn().mockRejectedValue(error);

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unknown error',
    });
  });
});
