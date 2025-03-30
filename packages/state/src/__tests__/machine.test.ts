import { describe, expect, it } from 'vitest';
import { interpret } from 'xstate';

import { createConversationMachine } from '../machine';

describe('Conversation Machine', () => {
  const machine = createConversationMachine();

  it('should handle basic query-response flow', () => {
    const service = interpret(machine).start();

    // Initial state
    expect(service.getSnapshot().value).toBe('idle');
    expect(service.getSnapshot().context.messages).toEqual([]);

    // Send query
    service.send({ type: 'QUERY', query: 'test query' });
    expect(service.getSnapshot().value).toBe('processing');
    expect(service.getSnapshot().context.currentQuery).toBe('test query');
    expect(service.getSnapshot().context.messages).toHaveLength(1);
    expect(service.getSnapshot().context.messages[0]).toEqual({
      role: 'user',
      content: 'test query',
    });

    // Send response
    service.send({ type: 'RESPONSE', message: 'test response' });
    expect(service.getSnapshot().value).toBe('idle');
    expect(service.getSnapshot().context.currentQuery).toBeUndefined();
    expect(service.getSnapshot().context.messages).toHaveLength(2);
    expect(service.getSnapshot().context.messages[1]).toEqual({
      role: 'assistant',
      content: 'test response',
    });

    service.stop();
  });

  it('should handle pipeline transitions', () => {
    const service = interpret(machine).start();

    // Start pipeline
    service.send({
      type: 'PIPELINE_START',
      steps: [{ message: 'step 1' }, { message: 'step 2' }],
    });

    // Check initial pipeline state
    expect(service.getSnapshot().value).toBe('pipeline');
    const pipeline = service.getSnapshot().context.pipeline;
    expect(pipeline).toBeDefined();
    if (pipeline) {
      expect(pipeline.currentStep).toBe(0);
      expect(pipeline.steps).toHaveLength(2);
      expect(pipeline.steps[0].status).toBe('processing');
      expect(pipeline.steps[1].status).toBe('pending');
    }

    // Complete pipeline
    service.send({ type: 'NEXT_STEP' });
    service.send({ type: 'NEXT_STEP' });

    expect(service.getSnapshot().value).toBe('idle');
    expect(service.getSnapshot().context.pipeline).toBeUndefined();

    service.stop();
  });
});
