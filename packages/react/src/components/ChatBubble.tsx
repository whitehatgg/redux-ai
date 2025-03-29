import React, { useEffect, useRef, useState } from 'react';
import type { ConversationMessage } from '@redux-ai/state';
import { useSelector } from '@xstate/react';
import { Loader2, MessageSquare, Minimize2, Sidebar } from 'lucide-react';

import { useReduxAI } from '../hooks/useReduxAI';
import { useReduxAIContext } from './ReduxAIProvider';

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
  const [input, setInput] = useState('');
  const { sendQuery, isProcessing } = useReduxAI();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { machineService } = useReduxAIContext();

  const messages = useSelector(
    machineService,
    state => state?.context?.messages ?? [],
    (a, b) => a === b
  );

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput || isProcessing || isSubmitting) {
      return;
    }

    setInput('');
    setIsSubmitting(true);

    try {
      await sendQuery(trimmedInput);
    } catch (error: unknown) {
      const errorContent = error instanceof Error ? error.message : String(error);
      machineService?.send({
        type: 'RESPONSE',
        message: errorContent,
      });
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
            {messages?.map((message: ConversationMessage, index: number) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`inline-block max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Typing indicator animation when processing */}
            {(isProcessing || isSubmitting) && (
              <div className="flex justify-start">
                <div className="inline-block max-w-[80%] rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-1">
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

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
                {isProcessing || isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </span>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
