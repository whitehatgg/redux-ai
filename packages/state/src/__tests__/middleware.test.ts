import { describe, expect, it, vi } from 'vitest';
import { createWorkflowMiddleware } from '../middleware';
import type { Middleware } from '@reduxjs/toolkit';

describe('Workflow Middleware', () => {
  // Helper to create a basic store mock
  const createStoreMock = () => {
    return {
      getState: vi.fn(),
      dispatch: vi.fn()
    };
  };

  it('should track and complete side effects', async () => {
    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['ASYNC_ACTION'],
      sideEffectTimeout: 1000
    });
    const store = createStoreMock();
    const next = vi.fn();
    const execute = middleware(store)(next);

    // Start a workflow that will wait for side effects
    const workflowAction = {
      type: 'WORKFLOW_START',
      intent: 'workflow'
    };

    // Execute async action that's registered as a side effect
    const asyncAction = {
      type: 'ASYNC_ACTION',
      payload: { data: 'test' }
    };

    // Execute workflow action first
    const workflowPromise = execute(workflowAction);

    // Then trigger the async action
    await execute(asyncAction);

    // Workflow should complete after side effect
    await workflowPromise;

    expect(next).toHaveBeenCalledWith(asyncAction);
    expect(next).toHaveBeenCalledWith(workflowAction);
  });

  it('should handle multiple concurrent side effects', async () => {
    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['ASYNC_1', 'ASYNC_2'],
      sideEffectTimeout: 1000
    });
    const store = createStoreMock();
    const next = vi.fn();
    const execute = middleware(store)(next);

    const workflowAction = {
      type: 'WORKFLOW_START',
      intent: 'workflow'
    };

    // Start workflow
    const workflowPromise = execute(workflowAction);

    // Trigger multiple async actions
    await Promise.all([
      execute({ type: 'ASYNC_1' }),
      execute({ type: 'ASYNC_2' })
    ]);

    // Workflow should complete after all side effects
    await workflowPromise;

    expect(next).toHaveBeenCalledTimes(3);
  });

  it('should handle side effect timeouts gracefully', async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, 'error');

    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['NEVER_COMPLETES'],
      sideEffectTimeout: 100 // Short timeout for testing
    });
    const store = createStoreMock();

    // Make next() return a never-resolving promise for NEVER_COMPLETES action
    const next = vi.fn((action) => {
      if (action.type === 'NEVER_COMPLETES') {
        return new Promise(() => {}); // Never resolves
      }
      return Promise.resolve();
    });

    const execute = middleware(store)(next);

    // Trigger an action that won't complete
    execute({ type: 'NEVER_COMPLETES' });

    // Start workflow that should time out waiting for the never-completing action
    const workflowPromise = execute({
      type: 'WORKFLOW_START',
      intent: 'workflow'
    }).catch(() => {}); // Catch any timeout rejections

    // Advance time past the timeout
    await vi.advanceTimersByTimeAsync(150);

    // Wait for workflow to complete (should complete due to timeout)
    await workflowPromise;

    expect(consoleError).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();

    consoleError.mockRestore();
    vi.useRealTimers();
  });

  it('should track workflow-specific side effects', async () => {
    const middleware = createWorkflowMiddleware({
      sideEffectTypes: ['ASYNC_ACTION'],
      sideEffectTimeout: 1000
    });
    const store = createStoreMock();
    const next = vi.fn();
    const execute = middleware(store)(next);

    // Start workflow with its own side effect
    const workflowAction = {
      type: 'WORKFLOW_START',
      intent: 'workflow',
      sideEffectId: 'workflow_effect_1'
    };

    await execute(workflowAction);

    // Complete the workflow's side effect
    await execute({
      type: 'SIDE_EFFECT_COMPLETE',
      sideEffectId: 'workflow_effect_1'
    });

    expect(next).toHaveBeenCalledTimes(2);
  });
});