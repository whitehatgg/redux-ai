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

// Placeholder for the actual LLM interaction.  Replace with your OpenAI API call.
const matchActionWithLLM = async (query: string, contextData: any) => {
  //  Replace this with your actual OpenAI API call.  This is a placeholder.
  //  The API call should take the query and contextData as input and return an action and a message.

  // Example placeholder: Simulate a successful API call.  Remove this for production
  const simulatedResponse = {
    action: contextData.chatHistory.length > 0 && query.includes("search") ? null : { type: 'applicant/setSearchTerm', payload: query },
    message: `Simulated LLM Response:  Query: ${query} Context: ${JSON.stringify(contextData)}`
  };

  return simulatedResponse;
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
          onActionMatch={async (query: string, context: string) => {
            try {
              const contextData = JSON.parse(context);
              const { action, message } = await matchActionWithLLM(query, contextData);
              return { action, message };
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