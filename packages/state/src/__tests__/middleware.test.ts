import { describe, expect, it, vi } from 'vitest';
import { createWorkflowMiddleware } from '../middleware';
import type { MiddlewareAPI } from '@reduxjs/toolkit';

describe('Workflow Middleware', () => {
  const createStoreMock = () => ({
    getState: vi.fn(),
    dispatch: vi.fn(),
  }) as MiddlewareAPI;

  it('should pass through all actions', () => {
    const middleware = createWorkflowMiddleware();
    const store = createStoreMock();
    const next = vi.fn(action => action);
    const execute = middleware(store)(next);

    const action = { type: 'TEST' };
    execute(action);
    expect(next).toHaveBeenCalledWith(action);
  });
});