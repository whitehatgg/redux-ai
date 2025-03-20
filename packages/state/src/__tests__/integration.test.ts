import { describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { createReduxAIState } from '../index';
import { createWorkflowMiddleware } from '../middleware';

describe('Basic Integration', () => {
  it('should process workflow actions', async () => {
    const actions = {
      'TEST_ACTION': vi.fn().mockReturnValue({ type: 'TEST_ACTION' })
    };

    const store = configureStore({
      reducer: (state = {}, action) => state,
      middleware: (getDefault) => getDefault().concat(
        createWorkflowMiddleware({ sideEffectTypes: ['TEST_ACTION'] })
      )
    });

    const storage = {
      storeInteraction: vi.fn().mockResolvedValue(undefined)
    };

    const ai = createReduxAIState({
      store,
      actions,
      storage: storage as any,
      endpoint: 'test'
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: 'Test',
        intent: 'workflow',
        workflow: [{
          message: 'Step 1',
          intent: 'action',
          action: { type: 'TEST_ACTION' }
        }]
      })
    });

    const result = await ai.processQuery('test');

    expect(result).toBeDefined();
    expect(actions.TEST_ACTION).toHaveBeenCalled();
    expect(storage.storeInteraction).toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const error = new Error('Test error');
    const actions = {
      'FAIL_ACTION': vi.fn().mockRejectedValue(error)
    };

    const store = configureStore({
      reducer: (state = {}, action) => state,
      middleware: (getDefault) => getDefault().concat(
        createWorkflowMiddleware({ sideEffectTypes: ['FAIL_ACTION'] })
      )
    });

    const storage = {
      storeInteraction: vi.fn().mockResolvedValue(undefined)
    };

    const ai = createReduxAIState({
      store,
      actions,
      storage: storage as any,
      endpoint: 'test'
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: 'Test',
        intent: 'workflow',
        workflow: [{
          message: 'Error step',
          intent: 'action', 
          action: { type: 'FAIL_ACTION' }
        }]
      })
    });

    await expect(ai.processQuery('test')).rejects.toThrow(error);
    expect(actions.FAIL_ACTION).toHaveBeenCalled();
  });
});