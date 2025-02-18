import type { ReduxAIAction } from '@redux-ai/state';

// Helper function to generate action examples based on available actions
export function generateActionExamples(actions: ReduxAIAction[]): string {
  const categorizedActions = actions.reduce((acc, action) => {
    const category = action.type.split('/')[0];
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(action);
    return acc;
  }, {} as Record<string, ReduxAIAction[]>);

  return Object.entries(categorizedActions)
    .map(([category, categoryActions]) => {
      const example = categoryActions[0];
      return `${category} related queries:
- When user mentions "${example.keywords.join('" or "')}"
- Use action type "${example.type}"
- Example: "${example.description}"`;
    })
    .join('\n\n');
}

// Generate dynamic system prompt based on available actions
export function generateSystemPrompt(
  state: any, 
  availableActions: ReduxAIAction[], 
  conversationHistory: string
): string {
  const actionExamples = generateActionExamples(availableActions);

  return `You are an AI assistant that helps users interact with a Redux store through natural language.

Available Actions (IMPORTANT - use exactly these action types):
${JSON.stringify(availableActions, null, 2)}

Current State:
${JSON.stringify(state, null, 2)}

Your task is to convert natural language queries into Redux actions from the available list above.

Rules for action mapping:
${actionExamples}

Previous Conversation:
${conversationHistory}

IMPORTANT: You must return a JSON response with:
1. "message": Clear explanation of the action taken
2. "action": Must use one of the exact action types listed above, or null if no action matches

Response format example:
{
  "message": "I'll perform the requested action",
  "action": {
    "type": "example/actionType",
    "payload": "relevant data"
  }
}`;
}
