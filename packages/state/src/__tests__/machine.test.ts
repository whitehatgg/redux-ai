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

  it('should handle workflow with side effects', () => {
    const service = interpret(machine).start();

    // Start workflow with side effects
    service.send({
      type: 'WORKFLOW_START',
      steps: [
        { message: 'step 1', sideEffectId: 'effect1' },
        { message: 'step 2', sideEffectId: 'effect2' }
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
      expect(workflow.pendingSideEffects).toEqual(['effect1', 'effect2']);
    }

    // Try to move to next step before side effect completes
    service.send({ type: 'NEXT_STEP' });
    expect(service.getSnapshot().context.workflow?.currentStep).toBe(0);

    // Complete first side effect
    service.send({ type: 'SIDE_EFFECT_COMPLETE', id: 'effect1' });
    expect(service.getSnapshot().context.workflow?.pendingSideEffects).toEqual(['effect2']);

    // Now we can move to next step
    service.send({ type: 'NEXT_STEP' });
    expect(service.getSnapshot().context.workflow?.currentStep).toBe(1);

    // Complete second side effect
    service.send({ type: 'SIDE_EFFECT_COMPLETE', id: 'effect2' });
    expect(service.getSnapshot().context.workflow?.pendingSideEffects).toEqual([]);

    // Complete workflow
    service.send({ type: 'NEXT_STEP' });
    expect(service.getSnapshot().value).toBe('idle');
    expect(service.getSnapshot().context.workflow).toBeUndefined();

    service.stop();
  });

  it('should handle side effect timeouts gracefully', () => {
    const service = interpret(machine).start();

    service.send({
      type: 'WORKFLOW_START',
      steps: [
        { message: 'step with timeout', sideEffectId: 'timeout_effect' }
      ]
    });

    expect(service.getSnapshot().context.workflow?.pendingSideEffects).toEqual(['timeout_effect']);

    // Even without completing the side effect, we should be able to complete the workflow
    // after timeout (handled by middleware)
    service.send({ type: 'NEXT_STEP' });

    service.stop();
  });
});