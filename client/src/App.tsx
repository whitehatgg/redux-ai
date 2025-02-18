import { Provider } from 'react-redux';
import { store } from './store';
import { ChatBubble, ActivityLog, ReduxAIProvider } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import type { ReduxAIAction } from '@redux-ai/state';
import { ApplicantTable } from './components/ApplicantTable';
import { useState } from 'react';

// Define available actions with rich descriptions and keywords
const availableActions: ReduxAIAction[] = [
  {
    type: 'applicant/setVisibleColumns',
    description: 'Control column visibility in tables',
    keywords: ['show', 'hide', 'column', 'field', 'display', 'visible', 'table']
  },
  {
    type: 'applicant/toggleSearch',
    description: 'Toggle search functionality',
    keywords: ['enable', 'disable', 'search', 'toggle', 'switch']
  },
  {
    type: 'applicant/setSearchTerm',
    description: 'Set search filter value',
    keywords: ['search', 'find', 'filter', 'query']
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
        >
          <AppContent />
        </ReduxAIProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;
