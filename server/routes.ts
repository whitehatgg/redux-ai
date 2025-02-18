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

function generateSystemPrompt(state: any, availableActions: ReduxAIAction[]): string {
  return `You are an AI assistant that helps users interact with a Redux store through natural language.

Available Actions:
${JSON.stringify(availableActions, null, 2)}

Current State:
${JSON.stringify(state, null, 2)}

Your task is to convert natural language queries into Redux actions.
You must respond with a JSON object containing:
1. "message": A clear explanation of what action you're taking
2. "action": The Redux action to dispatch, using EXACTLY one of the available action types, or null if no action matches

Example response format:
{
  "message": "I'll help you with that request",
  "action": {
    "type": "example/action",
    "payload": "value"
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
        return res.status(500).json({ 
          error: 'OpenAI client is not initialized. Please ensure API key is configured.' 
        });
      }

      const { query, state, availableActions } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      if (!availableActions || !Array.isArray(availableActions) || availableActions.length === 0) {
        return res.status(400).json({ error: 'Available actions are required and must be non-empty array' });
      }

      const systemPrompt = generateSystemPrompt(state, availableActions);

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