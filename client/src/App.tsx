import { Provider } from 'react-redux';
import { store } from './store';
import { ChatBubble, ActivityLog, ReduxAIProvider } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import type { ReduxAIAction } from '@redux-ai/state';
import { ApplicantTable } from './components/ApplicantTable';

// Define available actions for the demo
const demoActions: ReduxAIAction[] = [
  {
    type: 'demo/increment',
    description: 'Incrementing the counter',
    keywords: ['increment', 'increase', 'add', 'plus', 'up', 'raise']
  },
  {
    type: 'demo/decrement',
    description: 'Decrementing the counter',
    keywords: ['decrement', 'decrease', 'subtract', 'minus', 'reduce', 'lower', 'down']
  },
  {
    type: 'demo/resetCounter',
    description: 'Resetting the counter to zero',
    keywords: ['reset', 'clear', 'zero', 'start over']
  },
  {
    type: 'demo/setMessage',
    description: 'Setting a new message',
    keywords: ['set message', 'change message', 'update message', 'write message']
  },
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
  const counter = useSelector((state: RootState) => state.demo.counter);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          Redux AI Demo
        </h1>
        <div className="grid gap-8">
          <div className="flex flex-col gap-4">
            <div className="text-xl mb-4">
              Current Counter: {counter}
            </div>
            <ChatBubble />
            <ActivityLog />
            <div className="text-sm text-muted-foreground mb-8">
              Try asking: "increment the counter" or "what's the current value?"
            </div>
            <div className="border-t pt-8">
              <h2 className="text-2xl font-semibold mb-4">Applicant Management</h2>
              <div className="text-sm text-muted-foreground mb-4">
                Try asking: "show only name and email columns" or "enable search"
              </div>
              <ApplicantTable />
            </div>
          </div>
        </div>
      </main>
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