import { s } from '@redux-ai/schema';

function getActionInstructions(schema: ReturnType<typeof s.object>): string {
  return `
IMPORTANT: Use only valid Redux action formats:
{
  "type": "action/type",
  "payload": value
}`;
}

export function generateSystemPrompt(
  currentState: unknown,
  schema: ReturnType<typeof s.object>,
  conversationHistory: string
): string {
  if (!schema) {
    throw new Error('Schema must be provided');
  }

  const basePrompt = `You are an AI assistant that helps users interact with a Redux store through natural language.

Current State:
${JSON.stringify(currentState, null, 2)}

Your task is to:
1. For state queries:
   - Answer in natural language, like a conversation
   - Keep responses very short, 1-2 sentences maximum
   - If you can't find specific information, say "I don't see that information in the current state"
   - Never expose raw state data or technical details

2. For action requests:
   - Use only valid Redux action formats
   - Keep action payloads simple and direct
   - If you can't perform an action, say "Sorry, I can't perform that action"

${getActionInstructions(schema)}

Your response must be JSON with:
{
  "message": "A brief, natural response",
  "action": null
}

Or for actions:
{
  "message": "What this action will do",
  "action": {
    "type": "action/type",
    "payload": value
  }
}`;

  return conversationHistory.trim()
    ? `${basePrompt}\n\nPrevious Conversation:\n${conversationHistory}`
    : basePrompt;
}