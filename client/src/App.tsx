import { Provider } from 'react-redux';
import { store } from './store';
import { ChatBubble, ActivityLog, ReduxAIProvider, VectorDebugger } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import type { ReduxAIAction } from '@redux-ai/state';
import { ApplicantTable } from './components/ApplicantTable';
import { useState } from 'react';
import { Applicant } from '@/store/slices/applicantSlice';

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

// Custom action matching logic
const matchAction = (query: string) => {
  const lowerQuery = query.toLowerCase();

  // Match show columns command
  const showColumnsMatch = /show\s+(?:only\s+)?(\w+)(?:\s+(?:and|,)\s+(\w+))?\s*(?:columns?)?/.exec(lowerQuery);
  if (showColumnsMatch) {
    const requestedColumns = [showColumnsMatch[1], showColumnsMatch[2]].filter(Boolean);
    const validColumns: Array<keyof Applicant> = ['name', 'email', 'status', 'position', 'appliedDate'];

    const columns = requestedColumns.filter(col => 
      validColumns.includes(col as keyof Applicant)
    ) as Array<keyof Applicant>;

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

  // Match search command - Remove "for" from being included in the search term
  const searchMatch = /(?:search|find|look\s+for)\s+(?:for\s+)?(.+)/i.exec(lowerQuery);
  if (searchMatch) {
    const searchTerm = searchMatch[1].trim();
    return {
      action: {
        type: 'applicant/setSearchTerm',
        payload: searchTerm
      },
      message: `Searching for: ${searchTerm}`
    };
  }

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
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">Activity Log</h2>
            <VectorDebugger />
          </div>
        </div>
      </main>

      {/* Fixed Chat Bubble and Activity Log */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-4">
        <div className="max-w-[200px] sm:max-w-none text-sm text-muted-foreground bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow">
          Try asking: "show only name and email columns" or "search for john@example.com"
        </div>
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
          onActionMatch={matchAction}
        >
          <AppContent />
        </ReduxAIProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;