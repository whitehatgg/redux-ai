import { useState } from 'react';
import { ActivityLog, ChatBubble, ReduxAIProvider } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';

import { ApplicantTable } from './components/ApplicantTable';
import { queryClient } from './lib/queryClient';
import { store } from './store';
import { storeSchema } from './store/schema';

function AppContent() {
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Section */}
      <div id="demo" className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-3xl font-bold">Live Demo</h2>
        <p className="mb-8 text-center text-muted-foreground">
          Try Redux AI in action! Use the chat bubble to control the applicant table below.
        </p>
        <div className="grid gap-8">
          <div className="flex flex-col gap-4">
            <ApplicantTable />
          </div>
        </div>
      </div>

      {/* Chat Bubble */}
      <div className="fixed bottom-4 right-4 z-40">
        <ChatBubble
          className="w-[350px] rounded-lg border bg-background shadow-lg sm:w-[400px]"
          onToggleActivityLog={() => setShowActivityLog(!showActivityLog)}
          isMinimized={isMinimized}
          onMinimize={() => setIsMinimized(!isMinimized)}
        />
      </div>

      <ActivityLog open={showActivityLog} onClose={() => setShowActivityLog(false)} />
    </div>
  );
}

function App() {
  console.log('Store Schema:', storeSchema);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ReduxAIProvider store={store} schema={storeSchema} apiEndpoint="/api/query">
          <AppContent />
        </ReduxAIProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
