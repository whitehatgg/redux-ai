import type { ReduxAIAction } from './index';

// Helper function to generate action examples based on available actions
export function generateActionExamples(actions: ReduxAIAction[]): string {
  const categorizedActions = actions.reduce(
    (acc, action) => {
      const category = action.type.split('/')[0];
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(action);
      return acc;
    },
    {} as Record<string, ReduxAIAction[]>
  );

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
  state: unknown,
  availableActions: ReduxAIAction[],
  conversationHistory: string
): string {
  const actionExamples = generateActionExamples(availableActions);

  // Base prompt that doesn't depend on conversation history
  const basePrompt = `You are an AI assistant that helps users interact with a Redux store through natural language.

Available Actions (IMPORTANT - use exactly these action types):
${JSON.stringify(availableActions, null, 2)}

Current State:
${JSON.stringify(state, null, 2)}

Your task is to:
1. For state queries:
   - Respond with natural language focused on what was specifically asked
   - For general state queries (e.g. "what's in the state"), give an overview of key data
   - For specific queries (e.g. "how many pending applicants"), focus only on the relevant information
   - Always explain the meaning of the data, don't just list values
   - Examples:
     Query: "What's in the state?"
     Response: "The store contains 3 pending job applications and 2 approved applications. The latest application was submitted by John Doe."

     Query: "How many pending applications?"
     Response: "There are currently 3 pending applications awaiting review."

2. For action requests:
   - Use one of the following action mappings:
${actionExamples}

IMPORTANT: Return a JSON response with:
1. "message": For state queries, provide a focused natural language response about the requested information. For actions, explain what will be done.
2. "action": Must be exactly one of the action types listed above, or null for state queries.

Response format examples:
For state query:
{
  "message": "There are 3 pending applications waiting for review, and 2 that have been approved.",
  "action": null
}

For action:
{
  "message": "I'll add the new application for John Doe to the system",
  "action": {
    "type": "applications/add",
    "payload": { "name": "John Doe", "status": "pending" }
  }
}`;

  // Only include conversation history if it exists
  return conversationHistory.trim()
    ? `${basePrompt}\n\nPrevious Conversation:\n${conversationHistory}`
    : basePrompt;
}
