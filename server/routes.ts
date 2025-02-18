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

async function createChatCompletion(messages: any[], currentState?: any) {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });

    return response;
  } catch (error) {
    console.error('[OpenAI API Error]:', error);
    throw error;
  }
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

      const { prompt, availableActions, currentState } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!availableActions || !Array.isArray(availableActions) || availableActions.length === 0) {
        return res.status(400).json({ error: 'Available actions are required and must be non-empty array' });
      }

      console.log('[API] Processing query:', {
        promptLength: prompt.length,
        actionsCount: availableActions.length,
        hasState: !!currentState
      });

      const response = await createChatCompletion([
        {
          role: "system",
          content: prompt
        }
      ], currentState);

      if (!response.choices[0].message.content) {
        throw new Error('Invalid response format from AI');
      }

      const content = JSON.parse(response.choices[0].message.content);

      if (!content.message) {
        throw new Error('Invalid response format: missing message');
      }

      console.log('[API] Generated response:', {
        message: content.message,
        hasAction: !!content.action
      });

      res.json({ 
        message: content.message,
        action: content.action || null
      });
    } catch (error: unknown) {
      console.error('[API] Error processing query:', error);

      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return res.status(401).json({ 
            error: 'Invalid or missing OpenAI API key. Please check your configuration.'
          });
        }
        if (error.message.includes('does not have access to model')) {
          return res.status(403).json({ 
            error: 'Your OpenAI API key does not have access to the required model. Please check your OpenAI account settings.'
          });
        }
        if (error.message.includes('rate limit')) {
          return res.status(429).json({
            error: 'Rate limit exceeded. Please try again later.'
          });
        }
      }

      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}