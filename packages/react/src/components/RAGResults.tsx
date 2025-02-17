import React from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from './ui/card';
import { ScrollArea } from './ui/scroll-area';

interface RAGResultsProps {
  results: {
    ragResponse: string;
    similarDocs: Array<{
      query: string;
      response: string;
      state: string;
    }>;
    timestamp: string;
  } | null;
}

export const RAGResults: React.FC<RAGResultsProps> = ({ results }) => {
  if (!results) return null;

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>AI Response</CardTitle>
        <CardDescription>
          Generated at {new Date(results.timestamp).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Response:</h3>
            <p className="text-muted-foreground">{results.ragResponse}</p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Similar Interactions:</h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {results.similarDocs.map((doc, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <p className="text-sm font-medium">Query: {doc.query}</p>
                  <p className="text-sm text-muted-foreground">Response: {doc.response}</p>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
