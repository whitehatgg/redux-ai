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
      const { query, state, availableActions } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }

      // Get the current Redux state
      const currentState = state || {};
      const stateDescription = `Current Redux state:\n${JSON.stringify(currentState, null, 2)}`;
      const actionsDescription = availableActions 
        ? `\nAvailable actions:\n${JSON.stringify(availableActions, null, 2)}`
        : '';

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps users interact with Redux state through natural language.

State Structure:
The Redux state is structured with a 'demo' slice that contains:
- counter: number (starts at 0)
- message: string

${stateDescription}
${actionsDescription}

When responding to queries:
1. Look at state.demo.counter for the counter value
2. Always mention the current counter value in your response
3. If modifying the counter, mention both the previous and new value
4. Use the exact action types from availableActions

Respond with a JSON object containing:
{
  "message": "Natural language response explaining what was done, including current values",
  "action": null | {
    "type": "ACTION_TYPE",
    "payload": "PAYLOAD_IF_NEEDED"
  }
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