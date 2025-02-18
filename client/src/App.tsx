import { Provider } from 'react-redux';
import { store } from './store';
import { ChatBubble, ActivityLog, ReduxAIProvider } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import type { ReduxAIAction } from '@redux-ai/state';
import { ApplicantTable } from './components/ApplicantTable';
import { useState } from 'react';

// Define available actions without inference logic
const availableActions: ReduxAIAction[] = [
  {
    type: 'applicant/setVisibleColumns',
    description: 'Set which columns are visible in the table',
    keywords: ['show', 'hide', 'column', 'field']
  },
  {
    type: 'applicant/toggleSearch',
    description: 'Enable or disable the search functionality',
    keywords: ['enable', 'disable', 'search']
  },
  {
    type: 'applicant/setSearchTerm',
    description: 'Set the search term for filtering applicants',
    keywords: ['search', 'find', 'filter', 'look for']
  }
];

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
          availableActions={availableActions}
          onActionMatch={async (query: string) => {
            // Check if it's a search request
            const searchMatch = query.match(/search(?:\s+for)?\s+(.+)/i);

            if (searchMatch) {
              const searchTerm = searchMatch[1].trim();
              return {
                action: {
                  type: 'applicant/setSearchTerm',
                  payload: searchTerm
                },
                message: `Searching for "${searchTerm}" in applicants...`
              };
            }

            // Non-action queries should return null action but still provide a response
            return {
              action: null,
              message: 'I understand your request but I\'m not sure what action to take. Try asking me to search for something specific.'
            };
          }}
        >
          <AppContent />
        </ReduxAIProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;