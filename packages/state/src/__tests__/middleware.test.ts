import { describe, expect, it, vi } from 'vitest';
import { createWorkflowMiddleware } from '../middleware';
import type { Dispatch, AnyAction } from '@reduxjs/toolkit';

describe('Workflow Middleware', () => {
  const createStoreMock = () => ({
    getState: vi.fn(),
    dispatch: vi.fn()
  });

  it('should track and complete synchronous side effects', async () => {
    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['SYNC_ACTION'],
      sideEffectTimeout: 1000
    });
    const store = createStoreMock();
    const next = vi.fn().mockResolvedValue(undefined);
    const execute = middleware(store)(next);

    const syncAction = { type: 'SYNC_ACTION', payload: { data: 'test' } };
    await execute(syncAction);
    expect(next).toHaveBeenCalledWith(syncAction);
  });

  it('should track and complete asynchronous side effects', async () => {
    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['ASYNC_ACTION'],
      sideEffectTimeout: 1000
    });
    const store = createStoreMock();
    const next = vi.fn().mockImplementation((action: AnyAction) => 
      action.type === 'ASYNC_ACTION' ? 
        new Promise(resolve => setTimeout(resolve, 50)) : 
        Promise.resolve()
    );

    const execute = middleware(store)(next);
    const actions = [
      { type: 'ASYNC_ACTION', payload: { data: 'test' } },
      { type: 'FOLLOW_UP' }
    ];

    await Promise.all(actions.map(action => execute(action)));
    expect(next).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledWith(actions[0]);
    expect(next).toHaveBeenCalledWith(actions[1]);
  });

  it('should handle side effect timeouts gracefully', async () => {
    vi.useFakeTimers();
    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['NEVER_COMPLETES'],
      sideEffectTimeout: 100
    });
    const store = createStoreMock();
    const next = vi.fn().mockImplementation((action: AnyAction) => 
      action.type === 'NEVER_COMPLETES' ? 
        new Promise(() => {}) : 
        Promise.resolve()
    );

    const execute = middleware(store)(next);
    execute({ type: 'NEVER_COMPLETES' });
    const followUpPromise = execute({ type: 'FOLLOW_UP' });

    await vi.advanceTimersByTimeAsync(150);
    await followUpPromise.catch(() => {});

    expect(next).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('should handle multiple concurrent side effects', async () => {
    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['API_REQUEST'],
      sideEffectTimeout: 1000
    });
    const store = createStoreMock();
    const next = vi.fn().mockImplementation((action: AnyAction) => 
      action.type === 'API_REQUEST' ? 
        new Promise(resolve => setTimeout(resolve, action.payload?.delay || 50)) : 
        Promise.resolve()
    );

    const execute = middleware(store)(next);
    const actions = [
      { type: 'API_REQUEST', payload: { delay: 30, id: 1 } },
      { type: 'API_REQUEST', payload: { delay: 50, id: 2 } },
      { type: 'API_REQUEST', payload: { delay: 20, id: 3 } },
      { type: 'SUMMARY_ACTION' }
    ];

    await Promise.all(actions.map(action => execute(action)));
    expect(next).toHaveBeenCalledTimes(4);
    actions.forEach(action => {
      expect(next).toHaveBeenCalledWith(action);
    });
  });
});