import { Provider } from 'react-redux';
import { store, initializeReduxAI } from './store';
import { ChatBubble, VectorDebugger } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { useEffect, useState } from 'react';

function AppContent() {
  const counter = useSelector((state: RootState) => state.demo.counter);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeReduxAI()
      .then(() => {
        setIsInitialized(true);
        console.log('ReduxAI initialized with counter:', counter);
      })
      .catch((err) => {
        console.error('Failed to initialize ReduxAI:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize AI functionality');
      });
  }, []);

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error initializing AI: {error}
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="animate-pulse p-4">
        Initializing AI functionality...
      </div>
    );
  }

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
            <VectorDebugger />
            <div className="text-sm text-muted-foreground">
              Try asking: "increment the counter" or "set a message"
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
        <AppContent />
        <Toaster />
      </Provider>
    </QueryClientProvider>
  );
}

export default App;