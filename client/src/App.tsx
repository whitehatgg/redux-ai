import { Provider } from 'react-redux';
import { store } from './store';
import { ChatBubble, ActivityLog, ReduxAIProvider } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import type { ReduxAIAction } from '@redux-ai/state';
import { ApplicantTable } from './components/ApplicantTable';
import { useState } from 'react';

// Define available actions for the demo
const demoActions: ReduxAIAction[] = [
  {
    type: 'applicant/setVisibleColumns',
    description: 'Updated the visible columns in the applicant table',
    keywords: ['show columns', 'hide columns', 'display columns', 'visible columns', 'show only']
  },
  {
    type: 'applicant/toggleSearch',
    description: 'Toggled the search functionality',
    keywords: ['enable search', 'disable search', 'toggle search', 'turn on search', 'turn off search']
  },
  {
    type: 'applicant/setSearchTerm',
    description: 'Set the search term to filter applicants',
    keywords: ['search for', 'find', 'look for', 'filter by', 'search applicant']
  }
];

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
        <ReduxAIProvider store={store} availableActions={demoActions}>
          <AppContent />
          <Toaster />
        </ReduxAIProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;