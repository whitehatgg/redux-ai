import { OpenAIProvider } from '@redux-ai/openai';
import { createRuntime } from '@redux-ai/runtime';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
  temperature: 0.7,
  maxTokens: 1000
});

export const runtime = createRuntime({
  provider
});