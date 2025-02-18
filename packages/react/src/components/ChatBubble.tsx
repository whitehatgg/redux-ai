import React, { useState, useRef, useEffect } from 'react';
import { useReduxAI } from '../hooks/useReduxAI';
import { MessageSquare, X, Sidebar, Minimize2 } from 'lucide-react';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  content: string;
}

interface ChatBubbleProps {
  className?: string;
  onToggleActivityLog?: () => void;
  isMinimized?: boolean;
  onMinimize?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  className, 
  onToggleActivityLog,
  isMinimized = false,
  onMinimize
}) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const { sendQuery, isProcessing, error } = useReduxAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

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

  if (isMinimized) {
    return (
      <button
        onClick={onMinimize}
        className="p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col h-[600px] max-h-[80vh] relative">
        {/* Fixed Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 border-b bg-background">
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
              onClick={onMinimize}
              className="p-1 hover:bg-muted rounded-md"
              title="Minimize Chat"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Messages Area with padding for header and form */}
        <div className="flex-1 overflow-y-auto pt-14 pb-24">
          <div className="p-4 space-y-4">
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
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Input Form */}
        <div className="absolute bottom-0 left-0 right-0 z-10 border-t bg-background">
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                disabled={isProcessing}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={isProcessing}
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
    </div>
  );
};