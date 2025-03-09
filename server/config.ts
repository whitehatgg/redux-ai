import { OpenAIProvider } from '@redux-ai/openai';
import { createRuntime } from '@redux-ai/runtime';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',  // Restore to gpt-4o as requested
  temperature: 0.7,
  maxTokens: 1000,
  debug: true // Enable debug logging to see what's happening
});

export const runtime = createRuntime({
  provider,
  debug: true // Enable runtime debug logging as well
});