import { Provider } from 'react-redux';
import { store } from './store';
import { ChatBubble, VectorDebugger, ReduxAIProvider } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import { useSelector } from 'react-redux';
import { RootState } from './store';

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
        <ReduxAIProvider store={store}>
          <AppContent />
          <Toaster />
        </ReduxAIProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;