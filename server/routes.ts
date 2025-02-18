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
            content: `You are an AI assistant that helps users interact with a Redux store through natural language commands.

Your task is to convert user queries into Redux actions. Each query must be mapped to one of the available actions if appropriate.

Available Actions:
${JSON.stringify(availableActions, null, 2)}

Current Application State:
${JSON.stringify(state, null, 2)}

Action Mapping Rules:
1. Search Queries:
   - When user asks to "search", "find", or "look for" something
   - Use the search/filter related action (e.g. setSearchTerm)
   - Extract the search term from their query
   - Example: "search for X" -> Use action type that includes "search" with payload "X"

2. Toggle Queries:
   - When user wants to "enable", "disable", "turn on/off" features
   - Use the relevant toggle action
   - Set payload to true/false appropriately

3. Visibility Queries:
   - When user wants to "show", "hide", or modify visible elements
   - Use the visibility related action
   - Include relevant fields in payload array

Previous Conversation:
${conversationHistory}

REQUIRED: Your response must be a JSON object with:
1. "message": A clear explanation of what action will be taken
2. "action": The Redux action to dispatch, or null if no matching action found

Example Response:
{
  "message": "I'll search for 'example'",
  "action": {
    "type": "anyType/setSearchTerm",
    "payload": "example"
  }
}

OR if no action matches:
{
  "message": "I couldn't find an appropriate action for your request. Here's why...",
  "action": null
}`
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