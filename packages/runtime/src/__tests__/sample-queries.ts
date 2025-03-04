import { createRuntime } from '../index';
import { BaseLLMProvider } from '../provider';
import type { CompletionResponse, IntentCompletionResponse, Message } from '../types';

// Complex test queries to demonstrate context-aware intent classification
const testQueries = {
  // Action queries with varying complexity
  action: {
    simple: 'create a new task with title "Test Task"',
    complex: 'update the priority of task #123 to high and assign it to Alice',
    ambiguous: 'mark all completed tasks as archived',
  },
  // State queries with different contexts
  state: {
    simple: 'show me the current user status',
    complex: 'what are all the high priority tasks assigned to me?',
    analytics: 'show task completion trends for the last week',
  },
  // Conversation queries
  conversation: {
    greeting: 'hi, how are you doing today?',
    help: 'can you explain how task priorities work?',
    clarification: 'what do you mean by archived tasks?',
  },
};

// Complex action schema to test against
const testActions = {
  'task/create': {
    description: 'Create a new task',
    params: ['title', 'priority', 'assignee'],
  },
  'task/update': {
    description: 'Update task properties',
    params: ['id', 'title?', 'priority?', 'assignee?'],
  },
  'task/archive': {
    description: 'Archive completed tasks',
    params: ['ids[]'],
  },
  'user/assign': {
    description: 'Assign tasks to users',
    params: ['taskId', 'userId'],
  },
};

// Mock LLM provider that simulates contextual understanding
class TestProvider extends BaseLLMProvider {
  constructor() {
    super({ timeout: 30000, debug: true });
  }

  async complete(prompt: string): Promise<CompletionResponse | IntentCompletionResponse> {
    console.log('\nProcessing LLM prompt:', prompt);

    // Simulate an LLM evaluating the context and generating responses
    const response = this.evaluatePrompt(prompt);
    console.log('LLM generated response:', JSON.stringify(response, null, 2));
    return response;
  }

  private evaluatePrompt(prompt: string): CompletionResponse | IntentCompletionResponse {
    const queryText = this.extractQueryFromPrompt(prompt);
    const actionsSchema = this.extractActionsFromPrompt(prompt);
    const state = this.extractStateFromPrompt(prompt);

    // Simulate LLM's intent classification based on complete context
    if (prompt.includes('intent":')) {
      return this.classifyIntent(queryText, actionsSchema, state);
    }

    // Handle action/state/conversation processing
    return this.generateResponse(queryText, actionsSchema, state);
  }

  private classifyIntent(query: string, actions: string, state: string): IntentCompletionResponse {
    // Simulate LLM analyzing query meaning against available actions/state
    const hasActionContext = actions && this.matchesActionSchema(query, actions);
    const hasStateContext = state && this.matchesStateQuery(query);

    if (hasActionContext) {
      return {
        intent: 'action' as const,
        message: 'Query maps to available action schema',
      };
    } else if (hasStateContext) {
      return {
        intent: 'state' as const,
        message: 'Query requests state information',
      };
    }

    return {
      intent: 'conversation' as const,
      message: 'General query detected',
    };
  }

  private generateResponse(query: string, actions: string, state: string): CompletionResponse {
    // Simulate LLM generating appropriate response based on context
    if (this.matchesActionSchema(query, actions)) {
      const actionType = this.determineActionType(query, actions);
      return {
        message: 'Processing task action',
        action: {
          type: actionType,
          payload: this.extractActionPayload(query),
        },
      };
    }

    if (this.matchesStateQuery(query)) {
      return {
        message: 'Current system state: ' + this.formatStateResponse(query, state),
        action: null,
      };
    }

    return {
      message: 'I understand your question about ' + query,
      action: null,
    };
  }

  private matchesActionSchema(query: string, actions: string): boolean {
    // Simulate LLM's semantic matching of query against action schema
    return (
      actions.includes('task/') &&
      (query.includes('create') ||
        query.includes('update') ||
        query.includes('archive') ||
        query.includes('assign'))
    );
  }

  private matchesStateQuery(query: string): boolean {
    // Simulate LLM's understanding of state-related queries
    return (
      query.includes('show') ||
      query.includes('what') ||
      query.includes('status') ||
      query.includes('trends')
    );
  }

  private determineActionType(query: string, _actions: string): string {
    // Simulate LLM selecting most appropriate action type
    if (query.includes('create')) return 'task/create';
    if (query.includes('update')) return 'task/update';
    if (query.includes('archive')) return 'task/archive';
    if (query.includes('assign')) return 'user/assign';
    return 'task/create'; // Default
  }

  private extractActionPayload(query: string): Record<string, unknown> {
    // Simulate LLM extracting structured data from natural language
    if (query.includes('create')) {
      const titleMatch = query.match(/"([^"]+)"/);
      return {
        title: titleMatch ? titleMatch[1] : 'Untitled Task',
        priority: 'normal',
        assignee: null,
      };
    }
    if (query.includes('update')) {
      const idMatch = query.match(/#(\d+)/);
      return {
        id: idMatch ? idMatch[1] : '0',
        priority: 'high',
        assignee: 'Alice',
      };
    }
    return {};
  }

  private formatStateResponse(query: string, _state: string): string {
    // Simulate LLM formatting state data based on query
    if (query.includes('status')) return 'Active';
    if (query.includes('trends')) return 'Increasing completion rate';
    return 'Data available';
  }

  private extractQueryFromPrompt(prompt: string): string {
    const match = prompt.match(/Query: (.*?)(?:\n|$)/);
    return match ? match[1] : '';
  }

  private extractActionsFromPrompt(prompt: string): string {
    const match = prompt.match(/Actions: (.*?)(?:\n|$)/);
    return match ? match[1] : '';
  }

  private extractStateFromPrompt(prompt: string): string {
    const match = prompt.match(/State: (.*?)(?:\n|$)/);
    return match ? match[1] : '';
  }

  protected async completeRaw(): Promise<unknown> {
    return {};
  }

  protected convertMessage(_message: Message): unknown {
    return {};
  }
}

// Test runner for complex scenarios
export async function runComplexTests() {
  const provider = new TestProvider();
  const runtime = createRuntime({ provider, debug: true });

  console.log('\nTesting Advanced Intent Classification\n');
  console.log('-'.repeat(50));

  try {
    // Test complex action intent
    console.log('\nTesting Complex Action Intent:');
    console.log(`Query: "${testQueries.action.complex}"`);
    const actionResult = await runtime.query({
      query: testQueries.action.complex,
      actions: testActions,
      state: { tasks: [] },
    });
    console.log('Result:', JSON.stringify(actionResult, null, 2));

    // Test state query with analytics
    console.log('\nTesting Analytics State Query:');
    console.log(`Query: "${testQueries.state.analytics}"`);
    const stateResult = await runtime.query({
      query: testQueries.state.analytics,
      state: {
        tasks: [],
        analytics: { completionTrend: 'increasing' },
      },
    });
    console.log('Result:', JSON.stringify(stateResult, null, 2));

    // Test ambiguous query that could be action or state
    console.log('\nTesting Ambiguous Query:');
    console.log(`Query: "${testQueries.action.ambiguous}"`);
    const ambiguousResult = await runtime.query({
      query: testQueries.action.ambiguous,
      actions: testActions,
      state: { tasks: [{ id: 1, completed: true }] },
    });
    console.log('Result:', JSON.stringify(ambiguousResult, null, 2));

    console.log('\nAll advanced classification tests completed successfully!');
  } catch (error) {
    console.error('\nTest failed:', error);
  }
}

// Run the complex tests
if (process.env.NODE_ENV !== 'test') {
  runComplexTests().catch(console.error);
}
