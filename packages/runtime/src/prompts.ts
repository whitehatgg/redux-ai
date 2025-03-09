import type { QueryParams } from './types';

function generateIntentPrompt(params: QueryParams): string {
  const hasActions = !!params.actions;
  const hasState = !!params.state;

  return `Analyze user query based ONLY on the following context:

${params.query ? `Query: "${params.query}"` : ''}
${hasActions ? `Available actions: ${JSON.stringify(params.actions, null, 2)}` : ''}
${hasState ? `Current state: ${JSON.stringify(params.state, null, 2)}` : ''}
${params.conversations ? `Previous conversations:\n${params.conversations}` : ''}

INTENT CLASSIFICATION RULES:
1. 'action' intent - ONLY if:
   - Actions schema is available (${hasActions ? 'YES' : 'NO'})
   - Query explicitly requests an operation
   - The operation EXACTLY matches an action defined in 'Available actions:'
   - Required parameters can be extracted from query

2. 'state' intent - ONLY if:
   - State data is available (${hasState ? 'YES' : 'NO'})
   - Query explicitly requests state information
   - The requested data exists in 'Current state:'

3. 'conversation' intent - ONLY if:
   - Query doesn't match action or state criteria
   - Focus is on dialogue or clarification
   - OR when required context (actions/state) is missing

REQUIRED JSON Response Format:
{
  "intent": "action" | "state" | "conversation",
  "message": "Clear explanation of intent classification",
  "reasoning": [
    "Context Analysis: [Available context elements]",
    "Query Mapping: [How query maps to context]",
    "Decision: [Why this intent was chosen]"
  ]
}`;
}

function generateActionPrompt(params: QueryParams): string {
  if (!params.actions) {
    throw new Error('Action prompt requires actions schema');
  }

  return `Process action request using ONLY the following schema:

Available actions: ${JSON.stringify(params.actions, null, 2)}

VALIDATION RULES:
1. Action type MUST be one of: ${Object.keys(params.actions).join(', ')}
2. Each action MUST follow its schema exactly
3. Required parameters MUST be included
4. Parameter types MUST match schema
5. NO parameters outside schema
6. NO default/assumed actions

REQUIRED JSON Response Format:
{
  "message": "Clear description of action being taken",
  "action": {
    "type": "[must be from schema keys]",
    "payload": {
      // Only parameters defined in schema
      // Must match types exactly
    }
  },
  "reasoning": [
    "Schema Match: [Which action type was matched]",
    "Parameter Validation: [How parameters meet schema]",
    "Compliance: [Confirmation of schema adherence]"
  ]
}`;
}

function generateStatePrompt(params: QueryParams): string {
  if (!params.state) {
    throw new Error('State prompt requires state data');
  }

  return `Process state query using ONLY this data:

Current state: ${JSON.stringify(params.state, null, 2)}

VALIDATION RULES:
1. ONLY access data shown in 'Current state:'
2. NO assumed or inferred values
3. NO accessing unavailable fields
4. Return ONLY explicitly requested information

REQUIRED JSON Response Format:
{
  "message": "Clear response about state information",
  "action": null,
  "reasoning": [
    "Data Availability: [State fields present]",
    "Query Match: [Requested vs available data]",
    "Response: [How data answers query]"
  ]
}`;
}

function generateConversationPrompt(params: QueryParams): string {
  return `Process conversation using ONLY provided context:

${params.conversations ? `Previous conversations:\n${params.conversations}` : 'No conversation history available'}

RESPONSE RULES:
1. ONLY reference provided conversation history
2. NO assumed knowledge
3. Focus on explicit context
4. Clear and direct responses

REQUIRED JSON Response Format:
{
  "message": "Clear conversational response",
  "action": null,
  "reasoning": [
    "Context Available: [Conversation history status]",
    "Query Analysis: [Understanding of request]",
    "Response Basis: [How response relates to context]"
  ]
}`;
}

export function generatePrompt(type: 'intent' | 'action' | 'state' | 'conversation', params: QueryParams): string {
  const promptGenerators = {
    intent: generateIntentPrompt,
    action: generateActionPrompt,
    state: generateStatePrompt,
    conversation: generateConversationPrompt,
  };

  return promptGenerators[type](params) + '\n\nRespond ONLY with a valid JSON object including all required fields.';
}

export const JSON_FORMAT_MESSAGE = '\n\nRespond ONLY with a valid JSON object including all required fields (message, action, reasoning).';