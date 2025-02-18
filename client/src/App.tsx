import { Provider } from 'react-redux';
import { store } from './store';
import { ChatBubble, ActivityLog, ReduxAIProvider } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
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

  // Match search command
  const searchMatch = lowerQuery.match(/(?:search|find|look\s+for)\s+(.+)/i);
  if (searchMatch) {
    return {
      action: {
        type: 'applicant/setSearchTerm',
        payload: searchMatch[1].trim()
      },
      message: `Searching for: ${searchMatch[1].trim()}`
    };
  }

  // Match other actions based on keywords
  for (const action of demoActions) {
    if (action.keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()))) {
      return {
        action: { type: action.type },
        message: action.description
      };
    }
  }

  return null;
};

function AppContent() {
  const [showActivityLog, setShowActivityLog] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          Redux AI Demo
        </h1>
        <div className="grid gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold mb-4">Applicant Management</h2>
            <ApplicantTable />
          </div>
        </div>
      </main>

      {/* Fixed Chat Bubble */}
      <div className="fixed bottom-4 right-4 z-50">
        <ChatBubble 
          className="w-[350px] h-[450px] shadow-lg rounded-lg bg-background border" 
          onToggleActivityLog={() => setShowActivityLog(!showActivityLog)}
        />
      </div>
      <ActivityLog 
        open={showActivityLog} 
        onClose={() => setShowActivityLog(false)} 
      />
      <div className="text-sm text-muted-foreground fixed bottom-20 right-4 z-50 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow">
        Try asking: "show only name and email columns" or "search for john@example.com"
      </div>
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
          <Toaster />
        </ReduxAIProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;