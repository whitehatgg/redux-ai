import type { Express } from "express";
import { createServer } from "http";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express) {
  // Add health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).send('OK');
  });

  app.post('/api/query', async (req, res) => {
    try {
      const { query, state, availableActions, previousInteractions = [] } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }

      // Format previous interactions for context
      const conversationHistory = previousInteractions
        .map((interaction: any) => `User: ${interaction.query}\nAssistant: ${interaction.response}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps users interact with Redux state through natural language.
Your task is to analyze user queries and determine appropriate Redux actions to dispatch.

Available Actions:
${JSON.stringify(availableActions, null, 2)}

Current Application State:
${JSON.stringify(state, null, 2)}

Previous Conversation:
${conversationHistory}

Instructions:
1. Analyze the user's query and the current state
2. Determine if any available action matches the user's intent
3. Return a JSON response with:
   - A natural language message explaining what action will be taken
   - The action to dispatch (if applicable)

Notes:
- Only return actions that are in the availableActions list
- If no appropriate action is found, return null for the action`
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