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

    // Mock runtime with all required properties according to Runtime interface
    mockRuntime = {
      provider: {
        complete: vi.fn().mockResolvedValue({ message: 'Success' }),
      },
      messages: [{ role: 'system', content: 'Test system message' }],
      currentState: {},
      debug: false,
      query: vi.fn().mockImplementation(async () => ({ message: 'Success' })),
    } as Runtime;

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

    // Mock Express response with proper spy functions and event handling
    const jsonSpy = vi.fn();
    const statusSpy = vi.fn().mockReturnThis();
    const onSpy = vi.fn((event, callback) => {
      if (event === 'finish') {
        callback();
      }
      return mockRes;
    });

    mockRes = {
      json: jsonSpy,
      status: statusSpy,
      on: onSpy,
    };

    // Properly typed NextFunction mock
    mockNext = vi.fn() as NextFunction;
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
    mockRuntime.query = vi.fn().mockRejectedValue(new Error('Invalid API key'));

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid or missing API key. Please check your configuration.',
      isConfigured: false,
    });
  });

  it('should handle rate limit errors', async () => {
    mockRuntime.query = vi.fn().mockRejectedValue(new Error('rate limit exceeded'));

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Rate limit exceeded. Please try again later.',
    });
  });

  it('should handle model access errors', async () => {
    mockRuntime.query = vi.fn().mockRejectedValue(new Error('does not have access to model'));

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Your API key does not have access to the required model.',
      isConfigured: false,
    });
  });

  it('should handle unknown errors', async () => {
    mockRuntime.query = vi.fn().mockRejectedValue(new Error('Unknown error'));

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unknown error',
    });
  });
});
