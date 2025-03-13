import { BaseAdapter } from '@redux-ai/runtime';
import type { NextApiRequest, NextApiResponse } from 'next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NextjsAdapter } from '../adapter';

describe('NextjsAdapter', () => {
  let adapter: NextjsAdapter;
  let mockRuntime: any;
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;

  beforeEach(() => {
    vi.clearAllMocks();

    adapter = new NextjsAdapter();

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

  it('should pass through API key errors', async () => {
    const errorMessage = 'API key or authentication failed';
    mockRuntime.query = vi.fn().mockRejectedValue(new Error(errorMessage));

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: errorMessage,
      status: 'error'
    });
  });

  it('should pass through method errors', async () => {
    mockReq.method = 'GET';

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'GET not allowed',
      status: 'error'
    });
  });

  it('should pass through unknown errors', async () => {
    const errorMessage = 'Unknown error occurred';
    mockRuntime.query = vi.fn().mockRejectedValue(new Error(errorMessage));

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: errorMessage,
      status: 'error'
    });
  });

  it('should pass through not found errors', async () => {
    mockReq.url = '/wrong/path';

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Not found: /wrong/path',
      status: 'error'
    });
  });
});