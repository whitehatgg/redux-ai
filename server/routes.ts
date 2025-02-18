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

async function createChatCompletion(messages: any[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 200
    });

    return response;
  } catch (error) {
    console.error('OpenAI API Error:', error);
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

      const { query, systemPrompt, availableActions } = req.body;

      console.log('[API] Received query request:', {
        queryLength: query?.length,
        systemPromptLength: systemPrompt?.length,
        actionsCount: availableActions?.length
      });

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      if (!systemPrompt) {
        console.error('[API] Missing system prompt in request');
        return res.status(400).json({ error: 'System prompt is required' });
      }

      if (!availableActions || !Array.isArray(availableActions) || availableActions.length === 0) {
        return res.status(400).json({ error: 'Available actions are required and must be non-empty array' });
      }

      console.log('[API] Creating chat completion with prompt length:', systemPrompt.length);

      const response = await createChatCompletion([
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: query
        }
      ]);

      if (!response.choices[0].message.content) {
        throw new Error('Invalid response format from AI');
      }

      const content = JSON.parse(response.choices[0].message.content);

      if (!content.message) {
        throw new Error('Invalid response format: missing message');
      }

      console.log('[API] Successfully processed query');

      res.json({ 
        message: content.message,
        action: content.action || null
      });
    } catch (error: unknown) {
      console.error('Error processing query:', error);

      // Handle specific OpenAI API errors
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return res.status(401).json({ 
            error: 'Invalid or missing OpenAI API key. Please check your configuration.'
          });
        }
        if (error.message.includes('does not have access to model')) {
          return res.status(403).json({ 
            error: 'Your OpenAI API key does not have access to gpt-3.5-turbo. Please check your OpenAI account settings.'
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