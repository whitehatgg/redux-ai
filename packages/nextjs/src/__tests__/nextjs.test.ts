import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
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

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockReq = {
      method: 'POST',
      url: '/api/ai',
      body: {
        query: 'test query',
        state: {},
        actions: {},
      },
    };
  });

  it('should pass through API key errors', async () => {
    const errorMessage = 'API key or authentication failed';
    mockRuntime.query = vi.fn().mockRejectedValue(new Error(errorMessage));

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: errorMessage
    });
  });

  it('should pass through method errors', async () => {
    mockReq.method = 'GET';

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: 'Method not allowed'
    });
  });

  it('should pass through unknown errors', async () => {
    const errorMessage = 'Unknown error occurred';
    mockRuntime.query = vi.fn().mockRejectedValue(new Error(errorMessage));

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: errorMessage
    });
  });

  it('should pass through not found errors', async () => {
    mockReq.url = '/wrong/path';

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: 'Not found'
    });
  });
});