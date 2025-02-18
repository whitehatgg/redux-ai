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

// LLM interaction handler with proper validation
const matchActionWithLLM = async (query: string, contextData: any) => {
  try {
    // In a real implementation, this would be an OpenAI API call
    // For now, we'll simulate the response based on the query and context

    const searchTerms = ['search', 'find', 'look', 'filter'];
    const isSearchQuery = searchTerms.some(term => query.toLowerCase().includes(term));

    if (isSearchQuery) {
      // Extract the search term by removing the command words
      const searchTerm = query.toLowerCase()
        .replace(/^(search|find|look|filter)(\s+for)?/i, '')
        .trim();

      return {
        action: {
          type: 'applicant/setSearchTerm',
          payload: searchTerm
        },
        message: `Searching for "${searchTerm}" in applicants.`
      };
    }

    // If no specific action is determined, return a response based on context
    const recentInteractions = contextData.chatHistory || [];
    return {
      action: null,
      message: recentInteractions.length > 0
        ? `Based on your recent activity, I can help you search or filter the applicants. What would you like to do?`
        : `I can help you search through applicants or manage table columns. What would you like to do?`
    };

  } catch (error) {
    console.error('Error in matchActionWithLLM:', error);
    return {
      action: null,
      message: 'I encountered an error processing your request. Please try again.'
    };
  }
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
              const result = await matchActionWithLLM(query, contextData);

              // Validate the result before returning
              if (!result) {
                return null;
              }

              const { action, message } = result;

              // Validate action structure if present
              if (action && (!action.type || !demoActions.some(a => a.type === action.type))) {
                return {
                  action: null,
                  message: 'Invalid action type. Please try a different command.'
                };
              }

              return { action, message };
            } catch (error) {
              console.error('Error in onActionMatch:', error);
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