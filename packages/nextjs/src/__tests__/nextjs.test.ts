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
      query: vi.fn().mockImplementation(async () => ({ 
        message: 'Success', 
        action: null,
        intent: 'action',
        reasoning: ['Test reasoning']
      }))
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn()
    } as Partial<NextApiResponse>;

    mockReq = {
      url: '/api/ai',
      method: 'POST',
      body: {
        query: 'test query',
        state: {},
        actions: {}
      }
    } as Partial<NextApiRequest>;
  });

  it('should pass through method errors', async () => {
    mockReq.method = 'GET';
    const res = { ...mockRes } as NextApiResponse;

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, res);

    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should pass through not found errors', async () => {
    mockReq.url = '/different/path';
    const res = { ...mockRes } as NextApiResponse;

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, res);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  it('should handle successful queries', async () => {
    const res = { ...mockRes } as NextApiResponse;

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as NextApiRequest, res);

    expect(mockRuntime.query).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Success',
      action: null,
      intent: 'action',
      reasoning: ['Test reasoning']
    });
  });
});