// Reasoning: The edited `generateConversationPrompt` function replaces the original function entirely, aligning with the intention of creating a more task-focused and action-oriented conversation prompt.
// Reasoning:  All other functions remain unchanged because the intention only specified modifications to the conversation prompt.

import type { QueryParams } from './types';

function generateWorkflowPrompt(params: QueryParams): string {
  const hasActions = !!params.actions;
  const hasState = !!params.state;
  const hasConversations = !!params.conversations;

  return `Analyze and decompose the following user query into atomic operations:

USER QUERY: "${params.query}"
${hasActions ? `AVAILABLE ACTIONS: ${JSON.stringify(params.actions, null, 2)}` : ''}
${hasState ? `CURRENT STATE: ${JSON.stringify(params.state, null, 2)}` : ''}
${hasConversations ? `CONVERSATION HISTORY:\n${params.conversations}` : ''}

TASK:
Decompose the query into independent operations that can be processed sequentially.
Consider any references to previous conversations when identifying operations.

ANALYSIS GUIDELINES:
1. Identify distinct operations regardless of their type or complexity
2. Consider context from previous conversations when relevant
3. Preserve exact query text for each operation
4. Maintain the original sequence of operations
5. Do not interpret or modify the operations - only split them
6. Handle references to previous conversation context

RESPONSE FORMAT:
{
  "message": "Summary describing the identified sequence of operations",
  "steps": [
    {
      "query": "exact text from original query representing a single operation"
    }
  ]
}

VALIDATION REQUIREMENTS:
1. Each step must contain only one operation
2. Step queries must use exact text from the original query
3. Steps must be ordered as they appear in the query
4. Message must clearly describe the decomposition performed
5. Consider conversation context when splitting operations

Respond only with a valid JSON object following this exact format.`;
}

function generateIntentPrompt(params: QueryParams): string {
  const hasActions = !!params.actions;
  const hasState = !!params.state;
  const hasConversations = !!params.conversations;

  return `Analyze the following user query and determine the most appropriate intent:

USER QUERY: "${params.query}"
${hasActions ? `AVAILABLE ACTIONS: ${JSON.stringify(params.actions, null, 2)}` : ''}
${hasState ? `CURRENT STATE: ${JSON.stringify(params.state, null, 2)}` : ''}
${hasConversations ? `CONVERSATION HISTORY:\n${params.conversations}` : ''}

TASK:
Classify the query into one of the following intents, considering both the immediate query and conversation context:
- workflow: Multiple distinct operations that need to be processed separately
- action: Single operation that modifies system state
- state: Request for current system state or information
- conversation: Natural language interaction or query

CLASSIFICATION GUIDELINES:
1. WORKFLOW intent if:
   - Query contains multiple distinct operations
   - Operations need different handling approaches
   - Operations are connected by conjunctions or sequences
   Example: "search for X and tell me about Y"

2. ACTION intent if:
   - Query represents a single operation
   - Operation matches available actions schema
   - Operation would modify system state

3. STATE intent if:
   - Query requests information about current state
   - Requested information exists in current state
   - No system modification is required

4. CONVERSATION intent if:
   - Query is natural language interaction
   - No matching actions or state queries
   - Response requires natural language processing

RESPONSE FORMAT:
{
  "intent": "workflow" | "action" | "state" | "conversation",
  "message": "Clear explanation of the intent classification",
  "reasoning": [
    "Step by step analysis of why this intent was chosen"
  ],
  "action": null
}

Respond only with a valid JSON object following this exact format.`;
}

function generateActionPrompt(params: QueryParams): string {
  if (!params.actions) {
    throw new Error('Action prompt requires actions schema');
  }

  return `Process the following action request using the available schema:

USER QUERY: "${params.query}"
AVAILABLE ACTIONS: ${JSON.stringify(params.actions, null, 2)}
${params.conversations ? `CONVERSATION HISTORY:\n${params.conversations}` : ''}

TASK:
Identify and structure the appropriate action based on the query and conversation context.

PROCESSING GUIDELINES:
1. Match query intent to available action types
2. Extract required parameters from query and context
3. Validate parameters against schema
4. Structure response according to schema

RESPONSE FORMAT:
{
  "message": "Clear description of the action to be performed",
  "action": {
    "type": "action_type_from_schema",
    "payload": {
      // parameters as defined in schema
    }
  },
  "reasoning": [
    "Step by step explanation of action selection and parameter extraction"
  ]
}

VALIDATION REQUIREMENTS:
1. Action type must exist in schema
2. All required parameters must be provided
3. Parameters must match schema types
4. No extra parameters allowed

Respond only with a valid JSON object following this exact format.`;
}

function generateStatePrompt(params: QueryParams): string {
  if (!params.state) {
    throw new Error('State prompt requires state data');
  }

  return `Process the following state query using available data:

USER QUERY: "${params.query}"
CURRENT STATE: ${JSON.stringify(params.state, null, 2)}
${params.conversations ? `CONVERSATION HISTORY:\n${params.conversations}` : ''}

TASK:
Retrieve and format the requested state information, considering conversation context.

PROCESSING GUIDELINES:
1. Identify requested state information from query and context
2. Verify data availability in current state
3. Format response appropriately
4. Only include explicitly requested information

RESPONSE FORMAT:
{
  "message": "Clear response describing the requested state information",
  "action": null,
  "reasoning": [
    "Step by step explanation of state data retrieval and formatting"
  ]
}

VALIDATION REQUIREMENTS:
1. Only return available state data
2. No assumptions about missing data
3. Clear explanation of data context
4. Format appropriate to data type

Respond only with a valid JSON object following this exact format.`;
}

function generateConversationPrompt(params: QueryParams): string {
  return `Process the following assistance query:

USER QUERY: "${params.query}"
${params.actions ? `AVAILABLE ACTIONS: ${JSON.stringify(params.actions, null, 2)}` : ''}
${params.state ? `CURRENT STATE: ${JSON.stringify(params.state, null, 2)}` : ''}
${params.conversations ? `CONVERSATION HISTORY:\n${params.conversations}` : ''}

TASK:
Generate a focused response that guides the user towards available system capabilities and assistance options.

PROCESSING GUIDELINES:
1. Remember: This is an assistance system, not a general chatbot
   - Always guide users towards concrete actions and capabilities
   - Keep responses focused on available features and assistance
   - Avoid open-ended conversations

2. For capability queries:
   - List specific available actions and state queries
   - Describe how the system can assist with tasks
   - Focus on concrete, implementable capabilities

3. For task-related queries:
   - Suggest relevant actions or state queries
   - Guide users towards available solutions
   - Keep focus on system capabilities

4. Always:
   - Maintain professional, assistance-focused tone
   - Reference only available features
   - Guide users towards actionable outcomes

RESPONSE FORMAT:
{
  "message": "Clear assistance-focused response",
  "action": null,
  "reasoning": [
    "How the response guides user towards system capabilities",
    "Why specific assistance options were suggested"
  ]
}

VALIDATION REQUIREMENTS:
1. Responses must maintain assistance focus
2. Only reference actual system capabilities
3. Guide users towards concrete actions
4. Avoid open-ended chat scenarios

Respond only with a valid JSON object following this exact format.`;
}

export function generatePrompt(type: 'intent' | 'action' | 'state' | 'conversation' | 'workflow', params: QueryParams): string {
  const promptGenerators = {
    intent: generateIntentPrompt,
    action: generateActionPrompt,
    state: generateStatePrompt,
    conversation: generateConversationPrompt,
    workflow: generateWorkflowPrompt,
  };

  return promptGenerators[type](params);
}

export const JSON_FORMAT_MESSAGE = '\n\nRespond ONLY with a valid JSON object including all required fields.';