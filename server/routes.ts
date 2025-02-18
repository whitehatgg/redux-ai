import type { Express } from "express";
import { createServer } from "http";
import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express) {
  app.post('/api/query', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }

      // Get the current Redux state from the store
      const currentState = req.app.locals.store?.getState() || {};
      const stateDescription = `Current Redux state:\n${JSON.stringify(currentState, null, 2)}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps users interact with Redux state through natural language.

Current State Information:
${stateDescription}

Rules for working with the counter:
1. The counter is stored at state.demo.counter
2. The counter should start at 0 if not initialized
3. Use these exact actions for counter operations:
   - { type: 'INCREMENT' } to increase by 1
   - { type: 'DECREMENT' } to decrease by 1
   - { type: 'RESET_COUNTER' } to reset to 0

When checking the counter value:
1. Look for state.demo.counter in the current state
2. Always include the current counter value in your response
3. If an increment/decrement is requested, mention both the action taken and the previous value

Respond with a JSON object containing:
{
  "message": "Natural language response explaining what was done and the current counter value",
  "action": {
    "type": "ACTION_TYPE"
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

      // Store the interaction in vector storage
      try {
        await storage.storeInteraction(query, content.message, currentState || {});
        console.log('Stored interaction in vector storage');
      } catch (error) {
        console.error('Failed to store interaction:', error);
      }

      res.json({ 
        message: content.message,
        action: content.action || null,
        ragResults: {
          ragResponse: content.message,
          similarDocs: await storage.getInteractions(),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: unknown) {
      console.error('Error processing query:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  });

  // Add a route to fetch vector debug entries
  app.get('/api/vector/debug', async (req, res) => {
    try {
      const entries = await storage.getInteractions();
      console.log('Retrieved vector debug entries:', entries.length);
      res.json(entries);
    } catch (error) {
      console.error('Error fetching vector debug entries:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch debug entries'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}