import { Provider } from 'react-redux';
import { store } from './store';
import { ChatBubble, ActivityLog, ReduxAIProvider } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import type { ReduxAIAction } from '@redux-ai/state';
import { ApplicantTable } from './components/ApplicantTable';
import { useState } from 'react';

// Define available actions for the demo
const demoActions: ReduxAIAction[] = [
  {
    type: 'applicant/setVisibleColumns',
    description: 'Show or hide columns in the applicant table',
    keywords: ['show columns', 'hide columns', 'display columns', 'visible columns', 'show only']
  },
  {
    type: 'applicant/toggleSearch',
    description: 'Toggle the search functionality',
    keywords: ['enable search', 'disable search', 'toggle search', 'turn on search', 'turn off search']
  },
  {
    type: 'applicant/setSearchTerm',
    description: 'Search for applicants',
    keywords: ['search for', 'find', 'look for', 'filter by', 'search applicant']
  }
];

// Enhanced action matching logic with context
const matchAction = async (query: string, context?: string) => {
  const lowerQuery = query.toLowerCase().trim();
  const contextData = context ? JSON.parse(context) : null;

  // If we have context and it's a history-related query, don't trigger an action
  if (contextData && /^(?:what|show|tell\s+me)\s+(?:about|what)\s+happened/i.test(lowerQuery)) {
    const recentChanges = contextData.stateChanges[0];
    if (recentChanges) {
      return {
        action: null,
        message: `Recent activity: ${recentChanges.message}`
      };
    }
  }

  // Match show columns command
  const showColumnsMatch = /^show\s+(?:only\s+)?(\w+)(?:\s+(?:and|,)\s+(\w+))?\s*(?:columns?)?$/.exec(lowerQuery);
  if (showColumnsMatch) {
    const requestedColumns = [showColumnsMatch[1], showColumnsMatch[2]].filter(Boolean);
    const validColumns = ['name', 'email', 'status', 'position', 'appliedDate'];

    const columns = requestedColumns.filter(col =>
      validColumns.includes(col as any)
    );

    if (columns.length > 0) {
      return {
        action: {
          type: 'applicant/setVisibleColumns',
          payload: columns
        },
        message: `Showing only these columns: ${columns.join(', ')}`
      };
    }
  }

  // Match search command with context awareness
  const searchPattern = /^(?:(?:search|find|look|filter)\s+(?:for\s+)?|show\s+me\s+|get\s+)([a-zA-Z0-9@\s.]+)$/i;
  const searchMatch = searchPattern.exec(lowerQuery);
  if (searchMatch) {
    const searchTerm = searchMatch[1].trim();

    // Check if this is a repeated search
    if (contextData?.chatHistory.some(h => h.query === query)) {
      return {
        action: null,
        message: `You've already searched for "${searchTerm}". Would you like to try a different search?`
      };
    }

    return {
      action: {
        type: 'applicant/setSearchTerm',
        payload: searchTerm
      },
      message: `Searching for: ${searchTerm}`
    };
  }

  // If no action matches, return null to let the RAG system handle it
  return null;
};

function AppContent() {
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Redux AI Demo
        </h1>
        <div className="grid gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">Applicant Management</h2>
            <ApplicantTable />
          </div>
        </div>
      </main>

      <div className="fixed bottom-4 right-4 z-40">
        <ChatBubble 
          className="w-[350px] sm:w-[400px] shadow-lg rounded-lg bg-background border" 
          onToggleActivityLog={() => setShowActivityLog(!showActivityLog)}
          isMinimized={isMinimized}
          onMinimize={() => setIsMinimized(!isMinimized)}
        />
      </div>

      <ActivityLog 
        open={showActivityLog} 
        onClose={() => setShowActivityLog(false)} 
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ReduxAIProvider 
          store={store} 
          availableActions={demoActions}
          onActionMatch={async (query: string, context?: string) => {
            try {
              return await matchAction(query, context);
            } catch (error) {
              console.error('Error matching action:', error);
              return null;
            }
          }}
        >
          <AppContent />
        </ReduxAIProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;