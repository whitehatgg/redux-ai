import React, { useState } from 'react';
import { useReduxAI } from '../hooks/useReduxAI';
import { MessageSquare, X, Sidebar } from 'lucide-react';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  content: string;
}

interface ChatBubbleProps {
  className?: string;
  onToggleActivityLog?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ className, onToggleActivityLog }) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { sendQuery, isProcessing, error, isInitialized } = useReduxAI();

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
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">AI Assistant</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleActivityLog}
              className="p-1 hover:bg-muted rounded-md"
              title="Toggle Activity Log"
            >
              <Sidebar className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded-md"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg max-w-[80%] ${
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

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
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
          </div>
          {error && (
            <div className="mt-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};