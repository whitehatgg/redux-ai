import React from 'react';
import { useReduxAI } from '../hooks/useReduxAI';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  content: string;
}

export const ChatBubble: React.FC = () => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const { sendQuery, isProcessing, error, isInitialized, ragResults } = useReduxAI();

  React.useEffect(() => {
    // Add proper null checks and optional chaining
    if (ragResults?.similarDocs && ragResults.similarDocs.length > 0) {
      console.log('Previous interactions loaded:', ragResults.similarDocs);
    }
  }, [ragResults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !isInitialized) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      console.log('Sending query:', input);
      const response = await sendQuery(input);
      console.log('Received response:', response);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);
      const errorMessage: ChatMessage = {
        role: 'error',
        content: error instanceof Error ? error.message : 'Failed to get response'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  if (!isInitialized) {
    return (
      <div className="w-full max-w-md mx-auto p-4 text-center">
        Initializing AI functionality...
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-4">
        <div className="h-[400px] overflow-auto pr-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.role === 'error'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            disabled={isProcessing || !isInitialized}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={isProcessing || !isInitialized}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {isProcessing ? 'Sending...' : 'Send'}
          </button>
        </form>
        {error && (
          <div className="mt-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};