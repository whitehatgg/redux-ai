// Reasoning: The edited `generatePipelinePrompt` function replaces the original function entirely, aligning with the intention of creating a more robust prompt for multi-step queries.  The new prompt focuses on breaking down the query into executable actions with detailed specifications, improving the structure and clarity of the pipeline response.
// Reasoning: The rest of the functions (`generateIntentPrompt`, `generateActionPrompt`, `generateStatePrompt`, `generateConversationPrompt`, `generatePrompt`) remain unchanged because the intention only focuses on improving the pipeline prompt generation.

import type { QueryParams } from './types';

function generatePipelinePrompt(params: QueryParams): string {
  const hasActions = !!params.actions;
  const hasState = !!params.state;

  return `Break down this multi-step request into a sequence of executable actions:

USER QUERY: "${params.query}"
${hasActions ? `AVAILABLE ACTIONS: ${JSON.stringify(params.actions, null, 2)}` : ''}
${hasState ? `CURRENT STATE: ${JSON.stringify(params.state, null, 2)}` : ''}

Your task is to:
1. Break down the request into individual steps
2. For each step, determine if it's an action, state query, or conversation
   - ALWAYS use STATE intent when a step requests information about the current state
   - STATE intent applies for any phrases like "show me", "tell me", "what is", "display", "current state", etc.
   - If the query asks about filtered data or search results, classify that step as STATE intent, not conversation
3. If it's an action, specify the exact action type and parameters from the available actions
4. Resolve parameters intelligently based on state and user references
5. Include clear reasoning for each step

PARAMETER RESOLUTION GUIDELINES:
1. When user refers to entities by name, title, or description, resolve to the correct ID from state
2. For position-based references (first, last, third, etc.), find the corresponding entity in state
3. When an action requires an ID:
   a. Extract it directly if mentioned explicitly
   b. Look up the ID from state based on descriptive attributes
   c. Use ordering/position logic ("first", "last", etc.) when applicable
4. Always use entity IDs in action payloads, not names or descriptions
5. Be careful with successive actions where later steps reference entities from earlier steps

RESOLUTION EXAMPLES:
- "select item by name and then update its status" → Find the item's ID from the name
- "review first item in list and then perform action" → Find the first item's ID in the list
- "update item status" → Find the item ID based on current context/state
- "search for John and tell me current state" → First search, then STATE intent to show the results

RESPONSE FORMAT:
{
  "message": "Brief description of the overall pipeline",
  "intent": "pipeline",
  "action": null,
  "reasoning": ["Why this needs to be a pipeline"],
  "pipeline": [
    {
      "message": "Description of step 1",
      "intent": "action",
      "action": {
        "type": "exact_action_type",
        "payload": {
          "param1": "value1" // Use resolved IDs when appropriate
        }
      },
      "reasoning": ["Why this step is needed", "How parameters were resolved"]
    },
    {
      "message": "Description of step 2",
      "intent": "state", // Use state intent for showing information
      "action": null,    // No action for state intents
      "reasoning": ["Why this step needs state information"]
    }
  ]
}

VALIDATION REQUIREMENTS:
1. Each action must match the schema in AVAILABLE_ACTIONS
2. All required parameters must be provided with correct IDs resolved from state when applicable
3. Parameters must match schema types
4. Always prefer actual IDs over descriptive references
5. Never leave required parameter fields empty - resolve from state if not directly provided
6. Always use state intent for queries about current state, filtered results, or search results

Respond with a JSON object matching this exact format.`;
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
Classify the query into one of the following intents:
- pipeline: Multiple operations that need separate processing
- action: Single operation modifying system state
- state: Request for current system state/information
- conversation: Natural language interaction or query

CLASSIFICATION GUIDELINES:
1. PIPELINE intent if:
   - Query contains multiple distinct operations
   - Operations have different intents or targets
   - Operations need sequential processing
   Examples: 
   - "search for item and then update settings"
   - "filter results, modify configuration and show me the current state" 
   - "search for John and tell me current state"

2. ACTION intent if:
   - Query represents a single operation
   - Operation matches available actions schema
   - Operation would modify system state

3. STATE intent if:
   - Query requests information about current state
   - Query asks about filtered results or search results
   - Query contains phrases like "what is", "show me", "tell me", "display", "current state"
   - Query asks what items match certain criteria
   - Query asks about status of items, settings, or configuration
   - Requested information exists in current state
   - No system modification is required
   - Use this for the final step in pipelines requesting state information

4. CONVERSATION intent if:
   - Query is natural language interaction
   - No matching actions or state queries
   - Response requires natural language processing
   - IMPORTANT: Do NOT classify requests for state information as conversation

IMPORTANT: Queries asking about current state after filtering or searching (like "search for X and tell me current state") should be classified as PIPELINE intent with a second step that uses STATE intent.

RESPONSE FORMAT:
{
  "intent": "pipeline" | "action" | "state" | "conversation",
  "message": "Clear explanation of the intent classification",
  "reasoning": [
    "Step by step analysis of why this intent was chosen"
  ],
  "action": null
}

Respond ONLY with a valid JSON object following this exact format.`;
}

function generateActionPrompt(params: QueryParams): string {
  if (!params.actions) {
    throw new Error('Action prompt requires actions schema');
  }

  const hasState = !!params.state;

  return `Process the following action request using the available schema:

USER QUERY: "${params.query}"
AVAILABLE ACTIONS: ${JSON.stringify(params.actions, null, 2)}
${hasState ? `CURRENT STATE: ${JSON.stringify(params.state, null, 2)}` : ''}
${params.conversations ? `CONVERSATION HISTORY:\n${params.conversations}` : ''}

TASK:
Identify and structure the appropriate action based on the query, state, and conversation context.

PROCESSING GUIDELINES:
1. Match query intent to available action types
2. Extract or resolve required parameters from:
   a. First, directly from the user query if explicitly provided
   b. Second, identify objects by descriptive attributes (name, title, label, etc.) and extract their IDs from state
   c. Third, use position-based references ("first", "last", "third", etc.) to find the right object in state
   d. Finally, use conversation context if available
3. For entity references (like "select by name" or "first item"), always map to the correct ID by checking the state
4. When the query mentions a property that isn't the ID (like a name or title), find the actual ID from the state
5. Validate parameters against schema
6. Structure response according to schema

PARAMETER RESOLUTION EXAMPLES:
- For "select first item" → Find first item in the relevant collection and use its ID
- For "select item by name" → Find item with matching name in state and use its ID
- For "update item with ID" → Use the literal ID value provided
- For "assign to newest item" → Find the newest item in state and use its ID

RESPONSE FORMAT:
{
  "message": "Clear description of the action to be performed",
  "action": {
    "type": "action_type_from_schema",
    "payload": {
      // parameters as defined in schema with resolved IDs when needed
    }
  },
  "reasoning": [
    "Step by step explanation of action selection and parameter extraction/resolution"
  ]
}

VALIDATION REQUIREMENTS:
1. Action type must exist in schema
2. All required parameters must be provided with correct IDs resolved from state when applicable
3. Parameters must match schema types
4. Always prefer actual IDs over descriptive references
5. Never leave required parameter fields empty - resolve from state if not directly provided

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
   - If query mentions "current state", provide a comprehensive overview of relevant state data
   - If query asks about specific parts of state, focus on those parts
2. Verify data availability in current state
3. Format response appropriately as natural language with structured information
4. Include state information that directly answers the user's query
5. For general state queries, prioritize showing:
   - Current items (e.g., records, settings, configuration)
   - Active settings and configurations
   - Search/filter/sort status

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

export function generatePrompt(
  type: 'intent' | 'action' | 'state' | 'conversation' | 'pipeline',
  params: QueryParams
): string {
  const promptGenerators = {
    intent: generateIntentPrompt,
    action: generateActionPrompt,
    state: generateStatePrompt,
    conversation: generateConversationPrompt,
    pipeline: generatePipelinePrompt,
  };

  // Default to action prompt if type isn't recognized
  const generator = promptGenerators[type] || promptGenerators.action;
  return generator(params);
}

export const JSON_FORMAT_MESSAGE =
  '\n\nRespond ONLY with a valid JSON object including all required fields.';
