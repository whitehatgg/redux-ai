import { createServer } from "http";
import OpenAI from "openai";
import type { ReduxAIAction } from "@redux-ai/state";
import type { Express } from "express";

let openai: OpenAI;

try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (error) {
  console.error('Error initializing OpenAI:', error);
}

// Helper function to generate action examples based on available actions
function generateActionExamples(actions: ReduxAIAction[]): string {
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
function generateSystemPrompt(state: any, availableActions: ReduxAIAction[], conversationHistory: string): string {
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

export async function registerRoutes(app: Express) {
  app.get('/health', (_req, res) => {
    res.status(200).send('OK');
  });

  app.post('/api/query', async (req, res) => {
    try {
      if (!openai) {
        return res.status(500).json({ error: 'OpenAI client is not initialized' });
      }

      const { query, state, availableActions, previousInteractions = [] } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      if (!availableActions || !Array.isArray(availableActions) || availableActions.length === 0) {
        return res.status(400).json({ error: 'Available actions are required and must be non-empty array' });
      }

      const conversationHistory = previousInteractions
        .map((interaction: any) => `User: ${interaction.query}\nAssistant: ${interaction.response}`)
        .join('\n');

      const systemPrompt = generateSystemPrompt(state, availableActions, conversationHistory);

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: query
          }
        ],
        response_format: { type: "json_object" }
      });

      if (!response.choices[0].message.content) {
        throw new Error('Invalid response format from AI');
      }

      const content = JSON.parse(response.choices[0].message.content);

      if (!content.message) {
        throw new Error('Invalid response format: missing message');
      }

      res.json({ 
        message: content.message,
        action: content.action || null
      });
    } catch (error: unknown) {
      console.error('Error processing query:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}