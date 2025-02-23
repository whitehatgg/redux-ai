import { OpenAIProvider } from '@redux-ai/openai';
import { Runtime } from '@redux-ai/runtime';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 200,
});

// Create runtime instance
export const runtime = new Runtime({
  provider,
  debug: process.env.NODE_ENV === 'development',
});