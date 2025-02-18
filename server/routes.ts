import type { Express } from "express";
import { createServer } from "http";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express) {
  app.get('/health', (_req, res) => {
    res.status(200).send('OK');
  });

  app.post('/api/query', async (req, res) => {
    try {
      const { query, state, availableActions, previousInteractions = [] } = req.body;

      console.log('Received query:', query);
      console.log('Available actions:', availableActions);

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }

      const conversationHistory = previousInteractions
        .map((interaction: any) => `User: ${interaction.query}\nAssistant: ${interaction.response}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps users interact with a Redux application through natural language.

Your task is to convert natural language queries into appropriate Redux actions.

Key Instructions:
1. Extract Action Type:
   - Identify the user's intent from their query
   - Match it to an available action type

2. Extract Action Payload:
   - For search/filter actions: Use the search terms or filters mentioned
   - For toggle actions: Use boolean values
   - For visibility actions: Use array of fields/columns mentioned

3. Handle Common Patterns:
   When users say things like:
   - "search for X" or "find X" -> Extract X as the search term
   - "show/hide X" -> Extract X as the field to show/hide
   - "enable/disable X" -> Convert to true/false for toggles

Available Actions:
${JSON.stringify(availableActions, null, 2)}

Current Application State:
${JSON.stringify(state, null, 2)}

Previous Conversation:
${conversationHistory}

Example Responses:

For search queries:
{
  "message": "I'll search for the term 'example'",
  "action": {
    "type": "someAction/setSearchTerm",
    "payload": "example"
  }
}

For visibility:
{
  "message": "I'll show the requested columns",
  "action": {
    "type": "someAction/setVisibleColumns",
    "payload": ["field1", "field2"]
  }
}

For toggles:
{
  "message": "I'll enable the search feature",
  "action": {
    "type": "someAction/toggleSearch",
    "payload": true
  }
}

If no action matches:
{
  "message": "I couldn't find an appropriate action for your request. Here's why...",
  "action": null
}

Always return a JSON response with:
1. A clear "message" explaining what will be done
2. An "action" object with "type" and "payload" (or null if no match)`
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

      console.log('OpenAI Response:', response.choices[0].message.content);
      const content = JSON.parse(response.choices[0].message.content);

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