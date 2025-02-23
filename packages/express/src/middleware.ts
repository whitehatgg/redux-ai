import type { NextFunction, Request, Response } from 'express';
import type { Runtime } from '@redux-ai/runtime';
import { z } from 'zod';

// Validation schema for AI query requests
const querySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  actions: z.array(z.unknown()).min(1, 'Actions must be a non-empty array'),
  currentState: z.record(z.unknown()).optional(),
});

export type QueryRequest = z.infer<typeof querySchema>;

// Middleware for validating AI query requests
export function validateQuery(req: Request, res: Response, next: NextFunction) {
  try {
    querySchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    next(error);
  }
}

// Middleware for handling OpenAI-specific errors
export function handleAIErrors(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof Error) {
    if (err.message.includes('API key')) {
      return res.status(401).json({
        error: 'Invalid or missing OpenAI API key. Please check your configuration.',
        isConfigured: false,
      });
    }
    if (err.message.includes('does not have access to model')) {
      return res.status(403).json({
        error: 'Your OpenAI API key does not have access to the required model.',
        isConfigured: false,
      });
    }
    if (err.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
      });
    }
  }
  next(err);
}

// Middleware for checking OpenAI configuration
export function checkAIConfig(req: Request, res: Response, next: NextFunction) {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'AI features are currently disabled. Please configure your OpenAI API key to enable the demo.',
      isConfigured: false,
    });
  }
  next();
}

// Request logging middleware
export function logAIRequest(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { query, prompt, actions, currentState } = req.body;

  console.info('[API Request - Full]:', {
    rawQuery: query,
    promptLength: prompt?.length,
    actionsCount: actions?.length,
    actionTypes: actions?.map((a: { type: string }) => a.type),
    hasState: !!currentState,
    stateKeys: currentState ? Object.keys(currentState) : [],
  });

  // Capture and log response
  const originalJson = res.json;
  res.json = function(body) {
    console.info('[API Response]:', {
      message: body.message,
      hasAction: !!body.action,
      action: body.action,
    });
    return originalJson.call(res, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`Request completed in ${duration}ms`);
  });

  next();
}

// Factory function to create an AI query handler
export function createAIQueryHandler(runtime: Runtime) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await runtime.query(req.body);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
