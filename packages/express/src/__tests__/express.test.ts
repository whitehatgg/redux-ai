import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { ExpressAdapter } from '../index';

describe('ExpressAdapter', () => {
  let adapter: ExpressAdapter;
  let mockRuntime: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();

    adapter = new ExpressAdapter();

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
    } as Partial<Response>;

    mockReq = {
      path: '/api/query',
      method: 'POST',
      body: {
        query: 'test query',
        state: {},
        actions: {}
      },
      res: mockRes
    } as Partial<Request>;
  });

  it('should create an express handler', async () => {
    const handler = await adapter.createHandler({ runtime: mockRuntime });
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should pass through method errors', async () => {
    mockReq.method = 'GET';
    const res = { ...mockRes } as Response;

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, res);

    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should pass through not found errors', async () => {
    mockReq.path = '/different/path';
    const res = { ...mockRes } as Response;

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, res);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  it('should handle successful queries', async () => {
    const res = { ...mockRes } as Response;

    const handler = await adapter.createHandler({ runtime: mockRuntime });
    await handler(mockReq as Request, res);

    expect(mockRuntime.query).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Success',
      action: null,
      intent: 'action',
      reasoning: ['Test reasoning']
    });
  });
});