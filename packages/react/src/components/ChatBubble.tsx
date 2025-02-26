import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Minimize2, Sidebar } from 'lucide-react';
import { validateSchema } from '@redux-ai/schema';
import { useReduxAI } from '../hooks/useReduxAI';
import type { AIResponse } from '../hooks/useReduxAI';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: number;
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
  onMinimize,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const { sendQuery, isProcessing, error } = useReduxAI();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateMessageId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput || isProcessing || isSubmitting) {
      return;
    }

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now(),
    };

    setInput('');
    setIsSubmitting(true);
    setMessages(prev => [...prev, userMessage]);

    try {
      console.debug('[ChatBubble] Sending query:', trimmedInput);
      const response = await sendQuery(trimmedInput);
      console.debug('[ChatBubble] Raw response:', response);

      if (response && response.message) {
        console.debug('[ChatBubble] Creating assistant message with:', response.message);
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: response.message,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        console.error('[ChatBubble] Invalid response format:', response);
        throw new Error('Invalid response format received');
      }
    } catch (error) {
      console.error('[ChatBubble] Error processing query:', error);
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'error',
        content: error instanceof Error ? error.message : 'Failed to get response',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={onMinimize}
        className="rounded-full bg-primary p-4 text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={className}>
      <div className="relative flex h-[600px] max-h-[80vh] flex-col">
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b bg-background p-3">
          <h3 className="font-semibold">AI Assistant</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleActivityLog}
              className="rounded-md p-1 hover:bg-muted"
              title="Toggle Activity Log"
            >
              <Sidebar className="h-5 w-5" />
            </button>
            <button
              onClick={onMinimize}
              className="rounded-md p-1 hover:bg-muted"
              title="Minimize Chat"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-24 pt-14">
          <div className="space-y-4 p-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`inline-block max-w-[80%] rounded-lg p-3 ${
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

        <div className="absolute bottom-0 left-0 right-0 z-10 border-t bg-background">
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask something..."
                disabled={isProcessing || isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isProcessing || isSubmitting}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {isProcessing || isSubmitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};