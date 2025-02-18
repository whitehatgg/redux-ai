import { Provider } from 'react-redux';
import { store } from './store';
import { ChatBubble, ActivityLog, ReduxAIProvider } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import type { ReduxAIAction } from '@redux-ai/state';
import { ApplicantTable } from './components/ApplicantTable';

// Define available actions for the demo
const demoActions: ReduxAIAction[] = [
  {
    type: 'applicant/setVisibleColumns',
    description: 'Configure which columns are visible in the applicant table',
    keywords: ['show columns', 'hide columns', 'toggle columns', 'configure table']
  },
  {
    type: 'applicant/toggleSearch',
    description: 'Toggle search functionality for applicants',
    keywords: ['enable search', 'disable search', 'toggle search']
  },
  {
    type: 'applicant/setSearchTerm',
    description: 'Set the search term for filtering applicants',
    keywords: ['search applicants', 'filter applicants', 'find applicant']
  }
];

function AppContent() {
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

      {/* Fixed Chat Bubble and Activity Log */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-4">
        <div className="relative">
          <ChatBubble className="w-[350px] h-[450px] shadow-lg rounded-lg bg-background border" />
        </div>
        <ActivityLog className="w-[300px] h-[450px] bg-background border rounded-lg shadow-lg" />
      </div>
      <div className="text-sm text-muted-foreground fixed bottom-20 right-4 z-50 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow">
        Try asking: "show only name and email columns" or "enable search"
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