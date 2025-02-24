import type { ReduxAIAction } from './types';
import { s } from 'ajv-ts';

// Use ReturnType from ajv-ts
type StateSchema = ReturnType<typeof s.object>;

interface SchemaProperty {
  type?: string;
  description?: string;
}

// Helper function to generate action examples based on available actions
export function generateActionExamples(availableActions: ReduxAIAction[]): string {
  const categorizedActions = availableActions.reduce(
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
    .map(([category, actions]) => {
      const example = actions[0];
      return `${category} related queries:
- When user mentions "${example.keywords.join('" or "')}"
- For example: "${example.description}"
- Respond with action: { type: "${example.type}", payload: /* direct value, not an object */ }`;
    })
    .join('\n\n');
}

// Generate documentation from the store schema
function generateSchemaDoc(schema: StateSchema): string {
  try {
    // Safe access to schema properties with type assertion
    const schemaObj = schema as unknown as { properties?: Record<string, SchemaProperty> };
    if (!schemaObj || !schemaObj.properties) {
      return 'No schema description available';
    }

    return Object.entries(schemaObj.properties)
      .map(([key, value]) => {
        if (!value || typeof value !== 'object') {
          return `${key}: unknown`;
        }
        return `${key}: ${value.type || 'unknown'}${value.description ? ` (${value.description})` : ''}`;
      })
      .join('\n');
  } catch {
    return 'Error generating schema documentation';
  }
}

// Generate dynamic system prompt based on actions and schema
export function generateSystemPrompt(
  state: unknown,
  availableActions: ReduxAIAction[],
  conversationHistory: string,
  schema?: StateSchema
): string {
  const actionExamples = generateActionExamples(availableActions);

  // Base prompt
  let basePrompt = `You are an AI assistant that helps users interact with a Redux store through natural language.

Available Actions (IMPORTANT - use exactly these action types):
${JSON.stringify(availableActions, null, 2)}

Current State:
${JSON.stringify(state, null, 2)}`;

  // Add schema documentation if available
  if (schema) {
    basePrompt += `\n\nStore Schema:
${generateSchemaDoc(schema)}`;
  }

  basePrompt += `\n\nYour task is to:
1. For state queries:
   - Respond with natural language focused on what was specifically asked
   - For general state queries (e.g. "what's in the state"), give an overview of key data
   - For specific queries (e.g. "how many pending applicants"), focus only on the relevant information
   - Always explain the meaning of the data, don't just list values

2. For action requests:
   - Use the exact action types from the available actions list
   - When action requires search terms or text input, pass the value directly as payload (not as an object)
   - Match user intent to appropriate action
${actionExamples}

IMPORTANT: Return a JSON response with:
1. "message": For state queries, provide a focused natural language response about the requested information. For actions, explain what will be done.
2. "action": Must be an action object with type and payload fields, or null for state queries.`;

  // Only include conversation history if it exists
  return conversationHistory.trim()
    ? `${basePrompt}\n\nPrevious Conversation:\n${conversationHistory}`
    : basePrompt;
}