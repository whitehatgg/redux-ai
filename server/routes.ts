import { createServer } from 'http';
import type { Express } from 'express';
import OpenAI from 'openai';

let openai: OpenAI | null = null;
let isOpenAIConfigured = false;

try {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key is not configured - demo features will be disabled');
    isOpenAIConfigured = false;
  } else {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    isOpenAIConfigured = true;
  }
} catch (error) {
  console.error('Error initializing OpenAI:', error);
  isOpenAIConfigured = false;
}

async function createChatCompletion(
  messages: OpenAI.ChatCompletionMessageParam[],
  currentState?: Record<string, unknown>
) {
  if (!openai) {
    throw new Error('OpenAI client is not initialized');
  }

  try {
    console.info('[OpenAI Request]:', {
      messages: messages,
      state: currentState ? JSON.stringify(currentState).slice(0, 200) + '...' : 'No state',
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    console.info('[OpenAI Response]:', response.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('[OpenAI API Error]:', error);
    throw error;
  }
}

export async function registerRoutes(app: Express) {
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'OK',
      aiEnabled: isOpenAIConfigured,
    });
  });

  app.post('/api/query', async (req, res) => {
    if (!isOpenAIConfigured) {
      return res.status(503).json({
        error:
          'AI features are currently disabled. Please configure your OpenAI API key to enable the demo.',
        isConfigured: false,
      });
    }

    try {
      const { query, prompt, availableActions, currentState } = req.body;

      console.info('[API Request - Full]:', {
        rawQuery: query,
        promptLength: prompt?.length,
        availableActionsCount: availableActions?.length,
        availableActionTypes: availableActions?.map((a: { type: string }) => a.type),
        hasState: !!currentState,
        stateKeys: currentState ? Object.keys(currentState) : [],
      });

      if (!query) {
        console.warn('[API Error] Missing query in request');
        return res.status(400).json({ error: 'Query is required' });
      }

      if (!prompt) {
        console.warn('[API Error] Missing prompt in request');
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!availableActions || !Array.isArray(availableActions) || availableActions.length === 0) {
        console.warn('[API Error] Invalid availableActions:', availableActions);
        return res
          .status(400)
          .json({ error: 'Available actions are required and must be non-empty array' });
      }

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: query,
        },
      ];

      const response = await createChatCompletion(messages, currentState);

      if (!response.choices[0].message.content) {
        throw new Error('Invalid response format from AI');
      }

      const content = JSON.parse(response.choices[0].message.content);

      if (!content.message) {
        throw new Error('Invalid response format: missing message');
      }

      console.info('[API Response]:', {
        message: content.message,
        hasAction: !!content.action,
        action: content.action,
      });

      res.json({
        message: content.message,
        action: content.action || null,
      });
    } catch (error: unknown) {
      console.error('[API] Error processing query:', error);

      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return res.status(401).json({
            error: 'Invalid or missing OpenAI API key. Please check your configuration.',
            isConfigured: false,
          });
        }
        if (error.message.includes('does not have access to model')) {
          return res.status(403).json({
            error: 'Your OpenAI API key does not have access to the required model.',
            isConfigured: false,
          });
        }
        if (error.message.includes('rate limit')) {
          return res.status(429).json({
            error: 'Rate limit exceeded. Please try again later.',
          });
        }
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
