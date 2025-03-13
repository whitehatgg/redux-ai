import { describe, expect, it } from 'vitest';
import { createConversationMachine } from '../machine';
import { interpret } from 'xstate';

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
      content: 'test query'
    });

    // Send response
    service.send({ type: 'RESPONSE', message: 'test response' });
    expect(service.getSnapshot().value).toBe('idle');
    expect(service.getSnapshot().context.currentQuery).toBeUndefined();
    expect(service.getSnapshot().context.messages).toHaveLength(2);
    expect(service.getSnapshot().context.messages[1]).toEqual({
      role: 'assistant',
      content: 'test response'
    });

    service.stop();
  });

  it('should handle workflow transitions', () => {
    const service = interpret(machine).start();

    // Start workflow
    service.send({
      type: 'WORKFLOW_START',
      steps: [
        { message: 'step 1' },
        { message: 'step 2' }
      ]
    });

    // Check initial workflow state
    expect(service.getSnapshot().value).toBe('workflow');
    const workflow = service.getSnapshot().context.workflow;
    expect(workflow).toBeDefined();
    if (workflow) {
      expect(workflow.currentStep).toBe(0);
      expect(workflow.steps).toHaveLength(2);
      expect(workflow.steps[0].status).toBe('processing');
      expect(workflow.steps[1].status).toBe('pending');
    }

    // Complete workflow
    service.send({ type: 'NEXT_STEP' });
    service.send({ type: 'NEXT_STEP' });

    expect(service.getSnapshot().value).toBe('idle');
    expect(service.getSnapshot().context.workflow).toBeUndefined();

    service.stop();
  });
});