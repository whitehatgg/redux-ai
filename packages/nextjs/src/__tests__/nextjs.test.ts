import type { Runtime } from '@redux-ai/runtime';
import type { NextApiRequest, NextApiResponse } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHandler, NextjsAdapter } from '../index';

describe('NextjsAdapter', () => {
  let mockRuntime: Runtime;
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;

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
    };

    // Mock Next.js request
    mockReq = {
      method: 'POST',
      body: {
        query: 'test query',
        prompt: 'test prompt',
        actions: [],
        currentState: {},
      },
    };

    // Mock Next.js response
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a Next.js API route handler', () => {
    const adapter = new NextjsAdapter();
    const handler = adapter.createHandler({ runtime: mockRuntime });
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should handle successful queries', async () => {
    const expectedResponse = { message: 'Success', data: {} };
    mockRuntime.query = vi.fn().mockResolvedValue(expectedResponse);

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRuntime.query).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should handle method not allowed', async () => {
    const handler = createHandler({ runtime: mockRuntime });
    const getReq = { ...mockReq, method: 'GET' };

    await handler(getReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Method not allowed',
    });
  });

  it('should handle API key errors', async () => {
    const error = new Error('Invalid API key');
    mockRuntime.query = vi.fn().mockRejectedValue(error);

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

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
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Rate limit exceeded. Please try again later.',
    });
  });

  it('should handle model access errors', async () => {
    const error = new Error('does not have access to model');
    mockRuntime.query = vi.fn().mockRejectedValue(error);

    const handler = createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

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
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unknown error',
    });
  });
});
