import { describe, expect, it, vi } from 'vitest';
import { createWorkflowMiddleware } from '../middleware';
import type { UnknownAction, MiddlewareAPI } from '@reduxjs/toolkit';

interface TestAction extends UnknownAction {
  type: 'SYNC_ACTION' | 'ASYNC_ACTION' | 'NEVER_COMPLETES' | 'API_REQUEST';
  payload?: { delay?: number };
  result?: string;
}

describe('Workflow Middleware', () => {
  const createStoreMock = () => ({
    getState: vi.fn(),
    dispatch: vi.fn(),
  }) as MiddlewareAPI;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should handle synchronous actions immediately', () => {
    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['SYNC_ACTION'],
      debug: true,
    });
    const store = createStoreMock();
    const next = vi.fn(action => ({ ...action, result: 'sync' }));
    const execute = middleware(store)(next);

    const action = { type: 'SYNC_ACTION' } as TestAction;
    const result = execute(action);

    expect(result).toEqual({ type: 'SYNC_ACTION', result: 'sync' });
    expect(next).toHaveBeenCalledWith(action);
  });

  it('should handle asynchronous side effects', async () => {
    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['ASYNC_ACTION'],
      debug: true,
    });
    const store = createStoreMock();
    const next = vi.fn().mockResolvedValue({ type: 'ASYNC_ACTION', result: 'async' });
    const execute = middleware(store)(next);

    const action = { type: 'ASYNC_ACTION' } as TestAction;
    const promise = execute(action);

    // Process timers and promises
    vi.advanceTimersByTime(100);
    await Promise.resolve();

    const result = await promise;
    expect(result).toEqual({ type: 'ASYNC_ACTION', result: 'async' });
  });

  it('should handle timeouts for never-completing side effects', async () => {
    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['NEVER_COMPLETES'],
      sideEffectTimeout: 1000,
      debug: true,
    });
    const store = createStoreMock();
    const next = vi.fn(() => new Promise(() => {})); // Never resolves
    const execute = middleware(store)(next);

    const promise = execute({ type: 'NEVER_COMPLETES' } as TestAction);

    // Advance past timeout
    vi.advanceTimersByTime(1000);
    await Promise.resolve();

    await expect(promise).rejects.toThrow('Side effect timeout');
  });

  it('should handle concurrent side effects', async () => {
    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['API_REQUEST'],
      debug: true,
    });
    const store = createStoreMock();

    // Mock async action that resolves after delay
    const next = vi.fn((action: TestAction) => {
      return new Promise(resolve => 
        setTimeout(() => resolve({ ...action, result: 'done' }), action.payload?.delay || 0)
      );
    });

    const execute = middleware(store)(next);

    const actions = [
      { type: 'API_REQUEST', payload: { delay: 100 } },
      { type: 'API_REQUEST', payload: { delay: 200 } },
    ] as TestAction[];

    const promises = actions.map(action => execute(action));

    // Advance time past all delays
    vi.advanceTimersByTime(200);
    await Promise.resolve();

    const results = await Promise.all(promises);
    expect(results).toEqual([
      { type: 'API_REQUEST', payload: { delay: 100 }, result: 'done' },
      { type: 'API_REQUEST', payload: { delay: 200 }, result: 'done' }
    ]);
  });
});