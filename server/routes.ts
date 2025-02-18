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
      console.log('Available actions:', JSON.stringify(availableActions, null, 2));

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      if (!availableActions || !Array.isArray(availableActions) || availableActions.length === 0) {
        return res.status(400).json({ error: 'Available actions are required and must be non-empty array' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }

      const conversationHistory = previousInteractions
        .map((interaction: any) => `User: ${interaction.query}\nAssistant: ${interaction.response}`)
        .join('\n');

      const systemPrompt = `You are an AI assistant that helps users interact with a Redux store through natural language.

Available Actions (IMPORTANT - use exactly these action types):
${JSON.stringify(availableActions, null, 2)}

Current State:
${JSON.stringify(state, null, 2)}

Your task is to convert natural language queries into Redux actions from the available list above.

Rules for action mapping:
1. For search related queries:
   - When user mentions "search", "find", "lookup", "filter"
   - Extract the search term and use it as payload
   - Use the appropriate search action type from available actions
   - Example: "search for bob" would use an action like "applicant/setSearchTerm" with payload "bob"

2. For visibility related queries:
   - When user mentions "show", "hide", "display"
   - Extract the field names and use them as payload array
   - Use the appropriate visibility action type

3. For toggle queries:
   - When user mentions "enable", "disable", "turn on/off"
   - Use boolean true/false as payload
   - Use the appropriate toggle action type

Previous Conversation:
${conversationHistory}

IMPORTANT: You must return a JSON response with:
1. "message": Clear explanation of the action
2. "action": Must use one of the exact action types listed above, or null if no match

Example Response:
{
  "message": "I'll search for 'bob' in the records",
  "action": {
    "type": "applicant/setSearchTerm",
    "payload": "bob"
  }
}`;

      console.log('Sending prompt to OpenAI with available actions:', availableActions.map(a => a.type));

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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

      console.log('OpenAI Response:', response.choices[0].message.content);
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