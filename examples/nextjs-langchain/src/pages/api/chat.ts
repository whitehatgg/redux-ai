import { NextApiRequest, NextApiResponse } from 'next';
import { NextjsAdapter } from '@redux-ai/nextjs';
import { createRuntime } from '@redux-ai/runtime';
import { LangChainProvider } from '@redux-ai/langchain';
import { ChatOpenAI } from '@langchain/core/chat_models';

// Initialize LangChain provider
const provider = new LangChainProvider({
  model: new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 500,
  }),
});

// Create runtime instance
const runtime = createRuntime({ provider });

// Create Next.js adapter
const adapter = new NextjsAdapter();
const handler = adapter.createHandler({ runtime });

export default async function chatHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate request method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate API key
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'AI features are currently disabled. Please configure your OpenAI API key.',
    });
  }

  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Process the chat request through the handler
    await handler(req, res);
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
