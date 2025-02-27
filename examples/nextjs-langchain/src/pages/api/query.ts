import { LangChainProvider } from '@redux-ai/langchain';
import { NextjsAdapter } from '@redux-ai/nextjs';
import { Runtime } from '@redux-ai/runtime';
import { ChatOpenAI } from '@langchain/openai';
import { type NextApiRequest, type NextApiResponse } from 'next';

// Initialize LangChain provider
const provider = new LangChainProvider({
  model: new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  }),
});

// Create runtime instance without messages property
const runtime = new Runtime({
  provider,
  debug: process.env.NODE_ENV === 'development',
});

// Initialize Next.js adapter and create handler
const adapter = new NextjsAdapter();
const handler = adapter.createHandler({ runtime });

// Export API route handler
export default handler;
