import { useState } from 'react';
import { LangChainProvider } from '@redux-ai/langchain';
import { NextjsAdapter } from '@redux-ai/nextjs';
import { ChatOpenAI } from '@langchain/openai';

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize the LangChain provider with ChatOpenAI
  const model = new ChatOpenAI({
    modelName: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    temperature: 0.7,
    maxTokens: 200,
  });

  const provider = new LangChainProvider({ model });
  const adapter = new NextjsAdapter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const handler = adapter.createHandler({
        runtime: provider.runtime,
      });

      const response = await handler(
        {
          method: 'POST',
          body: {
            query: input,
            actions: [],
          },
        } as any,
        {
          status: (code: number) => ({ json: (data: any) => data }),
          json: (data: any) => data,
        } as any
      );

      setResponse(response.message);
    } catch (error) {
      console.error('Error:', error);
      setResponse('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Redux AI + LangChain Example</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter your message..."
            className="w-full rounded border p-2"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Send'}
        </button>
      </form>

      {response && (
        <div className="mt-4 rounded bg-gray-100 p-4">
          <h2 className="mb-2 font-bold">Response:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
