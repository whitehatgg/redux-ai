import React, { useState, useRef, useEffect } from 'react';
import { useReduxAI } from '../hooks/useReduxAI';
import { MessageSquare, Sidebar, Minimize2 } from 'lucide-react';

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
  onMinimize
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const { sendQuery, isProcessing, error } = useReduxAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateMessageId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput || isProcessing || isSubmitting) {
      return;
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now()
    };

    // Clear input immediately to prevent re-submission
    setInput('');
    setIsSubmitting(true);
    setMessages(prev => [...prev, userMessage]);

    try {
      // Process the query
      console.log('[ChatBubble] Processing query:', trimmedInput);
      const response = await sendQuery(trimmedInput);
      console.log('[ChatBubble] Received response:', response);

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[ChatBubble] Error processing query:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'error',
        content: error instanceof Error ? error.message : 'Failed to get response',
        timestamp: Date.now()
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
        className="p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col h-[600px] max-h-[80vh] relative">
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

        <div className="flex-1 overflow-y-auto pt-14 pb-24">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
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

        <div className="absolute bottom-0 left-0 right-0 z-10 border-t bg-background">
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                disabled={isProcessing || isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isProcessing || isSubmitting}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                {isProcessing || isSubmitting ? 'Sending...' : 'Send'}
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