import { Provider } from 'react-redux';
import { store } from './store';
import { ChatBubble, VectorDebugger, useVectorDebug } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';

function App() {
  const { entries, isLoading, error } = useVectorDebug();

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <div className="min-h-screen bg-background">
          <main className="container mx-auto py-8 px-4">
            <h1 className="text-4xl font-bold text-center mb-8">
              Redux AI Demo
            </h1>
            <div className="grid gap-8">
              <ChatBubble />
              {error && (
                <div className="text-red-500">
                  Error loading debug entries: {error}
                </div>
              )}
              {isLoading ? (
                <div>Loading debug entries...</div>
              ) : (
                <VectorDebugger entries={entries} />
              )}
            </div>
          </main>
        </div>
        <Toaster />
      </Provider>
    </QueryClientProvider>
  );
}

export default App;