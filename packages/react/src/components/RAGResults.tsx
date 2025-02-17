import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { cn } from '../lib/utils';

interface RAGResultsProps {
  results: {
    ragResponse: string;
    similarDocs: Array<{
      query: string;
      response: string;
      state: string;
      timestamp: string;
    }>;
    timestamp: string;
  } | null;
}

export const RAGResults: React.FC<RAGResultsProps> = ({ results }) => {
  if (!results) return null;

  return (
    <div className="w-full max-w-3xl rounded-lg border border-border bg-card text-card-foreground shadow">
      <div className="p-6">
        <h3 className="text-2xl font-semibold">AI Response</h3>
        <p className="text-sm text-muted-foreground">
          Generated at {new Date(results.timestamp).toLocaleString()}
        </p>
      </div>
      <div className="p-6 pt-0">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Response:</h3>
            <p className="text-muted-foreground">{results.ragResponse}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Similar Interactions:</h3>
            <ScrollArea.Root className="h-[300px] w-full rounded-md border">
              <ScrollArea.Viewport className="p-4">
                {results.similarDocs.map((doc, index) => (
                  <div key={index} className="mb-6 last:mb-0 p-4 bg-muted rounded-lg">
                    <div className="mb-2">
                      <p className="text-sm font-medium">Query: {doc.query}</p>
                      <p className="text-sm text-muted-foreground">Response: {doc.response}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium">State:</p>
                      <pre className="text-xs bg-background p-2 rounded mt-1 overflow-x-auto">
                        {doc.state}
                      </pre>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(doc.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar
                className="flex select-none touch-none p-0.5 bg-slate-100 transition-colors hover:bg-slate-200"
                orientation="vertical"
              >
                <ScrollArea.Thumb className="relative flex-1 rounded-full bg-slate-300" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </div>
        </div>
      </div>
    </div>
  );
};