import type { BaseAction } from '@redux-ai/schema';
import { s } from '@redux-ai/schema';
import { safeStringify } from './utils';

function generateExampleValue(schema: any): any {
  if (!schema) return undefined;

  switch (schema.type) {
    case 'string':
      return 'example';
    case 'number':
      return 42;
    case 'boolean':
      return true;
    case 'array':
      return [generateExampleValue(schema.items)];
    case 'object':
      if (!schema.properties) return {};
      const example: Record<string, any> = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        example[key] = generateExampleValue(value);
      }
      return example;
    default:
      return undefined;
  }
}

function getActionInstructions(schema: ReturnType<typeof s.object>): string {
  let instructions = `
IMPORTANT: Use ONLY these exact action types and formats:

For applicant/setSearchTerm:
{
  "type": "applicant/setSearchTerm",
  "payload": "search term"
}

DO NOT create or modify any other action types. Use exactly these formats with the EXACT same type strings.`;

  return instructions;
}

export function generateSystemPrompt(
  currentState: unknown,
  schema: ReturnType<typeof s.object>,
  conversationHistory: string
): string {
  if (!schema) {
    throw new Error('Schema must be provided');
  }

  const state = currentState as any;
  const currentColumns = state?.applicant?.tableConfig?.visibleColumns || [];
  const isSearchEnabled = state?.applicant?.tableConfig?.enableSearch;

  const basePrompt = `You are an AI assistant that helps users interact with a Redux store through natural language.

Current Application State:
${safeStringify(currentState)}

Current Search Status: ${isSearchEnabled ? 'Enabled' : 'Disabled'}
Current Visible Columns: ${safeStringify(currentColumns)}

${getActionInstructions(schema)}

CRITICAL: Your response must be valid JSON with:
1. "message": A clear description of what action you're taking
2. "action": Must exactly match one of the action formats shown above`;

  const finalPrompt = conversationHistory.trim()
    ? `${basePrompt}\n\nPrevious Conversation:\n${conversationHistory}`
    : basePrompt;

  return finalPrompt;
}