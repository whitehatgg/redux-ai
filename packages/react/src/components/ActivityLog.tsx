import React, { useState } from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Settings,
  X,
  Zap,
  Brain,
} from 'lucide-react';

import { useActivityLog } from '../hooks/useActivityLog';

interface ActivityLogProps {
  open?: boolean;
  onClose?: () => void;
}

const formatActionType = (type: string): string => {
  const parts = type.includes('/') ? type.split('/') : type.toLowerCase().split('_');
  return parts.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' › ');
};

const intentConfig = {
  action: { icon: Zap, label: 'Action', color: 'text-blue-500' },
  state: { icon: Settings, label: 'State', color: 'text-green-500' },
  conversation: { icon: MessageSquare, label: 'Conversation', color: 'text-primary' },
};

export const ActivityLog: React.FC<ActivityLogProps> = ({ open, onClose }) => {
  const { entries, isLoading, error } = useActivityLog();
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const toggleEntry = (id: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 border-r bg-background shadow-lg">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Activity Log</h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-muted"
          title="Close Activity Log"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <ScrollArea.Root className="h-[calc(100vh-5rem)]">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="space-y-4 p-4">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading activities...</div>
            ) : error ? (
              <div className="py-8 text-center text-destructive">{error}</div>
            ) : entries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No operations logged yet.
              </div>
            ) : (
              entries.map(entry => {
                const isExpanded = expandedEntries.has(entry.id);
                const intent = entry.metadata.intent || 'conversation';
                const config = intentConfig[intent as keyof typeof intentConfig] || intentConfig.conversation;
                const IntentIcon = config.icon;

                return (
                  <div key={entry.id} className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IntentIcon className={`h-4 w-4 ${config.color}`} />
                          <span className="text-sm font-medium">
                            {config.label}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.metadata.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {entry.metadata.action && (
                        <div className="mt-2 rounded-md bg-muted/50 p-2">
                          <div className="flex items-center gap-2 text-xs">
                            <ArrowRight className={`h-4 w-4 ${config.color}`} />
                            <span>{formatActionType(entry.metadata.action.type as string)}</span>
                          </div>
                        </div>
                      )}

                      {(entry.metadata.query || entry.metadata.response || entry.metadata.reasoning) && (
                        <button
                          onClick={() => toggleEntry(entry.id)}
                          className="mt-2 flex w-full items-center gap-2 rounded-md p-1 text-xs text-muted-foreground hover:bg-muted"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          <MessageSquare className="h-3 w-3" />
                          <span>Details</span>
                        </button>
                      )}

                      {isExpanded && (
                        <div className="mt-2 space-y-2 rounded-md bg-muted/30 p-2 text-xs">
                          {entry.metadata.query && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">User: </span>
                              {entry.metadata.query}
                            </div>
                          )}
                          {entry.metadata.response && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">Assistant: </span>
                              {entry.metadata.response}
                            </div>
                          )}
                          {entry.metadata.reasoning && entry.metadata.reasoning.length > 0 && (
                            <div className="mt-2 border-t border-border/50 pt-2">
                              <div className="flex items-center gap-1 font-medium text-muted-foreground">
                                <Brain className="h-3 w-3" />
                                <span>Reasoning:</span>
                              </div>
                              <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
                                {entry.metadata.reasoning.map((reason, index) => (
                                  <li key={index}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex touch-none select-none bg-muted p-0.5 transition-colors hover:bg-muted/80"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
};