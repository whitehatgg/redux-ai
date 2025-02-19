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
      embedding?: number[];
    }>;
    timestamp: string;
  } | null;
}

// Simple vector visualization using a heatmap
const VectorViz: React.FC<{ vector?: number[] }> = ({ vector }) => {
  if (!vector || vector.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-0.5 rounded bg-background p-2">
      {vector.slice(0, 64).map((value, i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-sm"
          style={{
            backgroundColor: `rgba(59, 130, 246, ${value})`,
            transition: 'background-color 0.2s',
          }}
          title={`Dimension ${i}: ${value.toFixed(3)}`}
        />
      ))}
    </div>
  );
};

export const RAGResults: React.FC<RAGResultsProps> = ({ results }) => {
  if (!results) return null;

  return (
    <div className="w-full max-w-3xl rounded-lg border border-border bg-card text-card-foreground shadow">
      <div className="p-6">
        <h3 className="text-2xl font-semibold">AI Debug View</h3>
        <p className="text-sm text-muted-foreground">
          Generated at {new Date(results.timestamp).toLocaleString()}
        </p>
      </div>
      <div className="p-6 pt-0">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-medium">Response:</h3>
            <p className="text-muted-foreground">{results.ragResponse}</p>
          </div>

          <div>
            <h3 className="mb-2 font-medium">Similar Interactions:</h3>
            <ScrollArea.Root className="h-[500px] w-full rounded-md border">
              <ScrollArea.Viewport className="p-4">
                {results.similarDocs.map((doc, index) => (
                  <div key={index} className="mb-6 rounded-lg bg-muted p-4 last:mb-0">
                    <div className="mb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">Query: {doc.query}</p>
                          <p className="text-sm text-muted-foreground">Response: {doc.response}</p>
                        </div>
                        <span className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">
                          Match Score: {((index === 0 ? 1 : 0.8 - index * 0.2) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Vector Visualization:</p>
                      <VectorViz vector={doc.embedding} />
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium">State:</p>
                      <pre className="mt-1 overflow-x-auto rounded bg-background p-2 text-xs">
                        {doc.state}
                      </pre>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(doc.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar
                className="flex touch-none select-none bg-slate-100 p-0.5 transition-colors hover:bg-slate-200"
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
