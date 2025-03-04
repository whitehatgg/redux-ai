import type { Runtime } from '@redux-ai/runtime';
import type { NextApiRequest, NextApiResponse } from 'next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NextjsAdapter } from '../adapter';

describe('NextjsAdapter', () => {
  let adapter: NextjsAdapter;
  let mockRuntime: Runtime;
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;

  beforeEach(() => {
    vi.clearAllMocks();

    adapter = new NextjsAdapter();

    mockRuntime = {
      debug: false,
      query: vi.fn().mockImplementation(async () => ({ message: 'Success', action: null })),
    } as unknown as Runtime;

    mockReq = {
      method: 'POST',
      url: '/api/query',
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
  });

  it('should handle API key errors', async () => {
    mockRuntime.query = vi.fn().mockRejectedValue(new Error('API key or authentication failed'));

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid or missing API key',
      status: 'error',
      isConfigured: false,
    });
  });

  it('should handle rate limit errors', async () => {
    // Mock isRateLimited to return true for this test
    vi.spyOn(adapter as any, 'isRateLimited').mockReturnValue(true);

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Rate limit exceeded',
      status: 'error',
      isConfigured: false,
    });
  });

  it('should handle method not allowed', async () => {
    mockReq.method = 'GET';

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Method not allowed',
      status: 'error',
      isConfigured: false,
    });
  });

  it('should handle unknown errors', async () => {
    mockRuntime.query = vi.fn().mockRejectedValue(new Error('Unknown error'));

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unknown error',
      status: 'error',
      isConfigured: false,
    });
  });
});
