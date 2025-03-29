import { useEffect, useState } from 'react';
import { ActivityLog, ChatBubble, ReduxAIProvider } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Route, Switch, useLocation } from 'wouter';

import { ApplicantDetail } from './components/ApplicantDetail';
import { ApplicantTable } from './components/ApplicantTable';
import { queryClient } from './lib/queryClient';
import { type RootState, store } from './store';
import { jsonActionSchema } from './store/schema';

// This component handles synchronization between Redux state and URL routing
function AppRouter() {
  const dispatch = useDispatch();
  const [, setLocation] = useLocation();
  const { selectedApplicantId } = useSelector((state: RootState) => state.applicant);

  // Central navigation effect - synchronizes Redux state with URL
  useEffect(() => {
    if (selectedApplicantId) {
      setLocation(`/applicant/${selectedApplicantId}`);
    } else {
      setLocation('/');
    }
  }, [selectedApplicantId, setLocation]);

  return (
    <Switch>
      <Route path="/applicant/:id" component={ApplicantDetail} />
      <Route path="/" component={ApplicantTable} />
    </Switch>
  );
}

function AppContent() {
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Section */}
      <div id="demo" className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-3xl font-bold">Applicant Tracking System</h2>
        <p className="mb-8 text-center text-muted-foreground">
          Try Redux AI in action! Use the chat bubble to control the applicant system below.
        </p>
        <div className="grid gap-8">
          <div className="flex flex-col gap-8">
            <AppRouter />
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
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ReduxAIProvider
          store={store}
          actions={jsonActionSchema}
          endpoint="/api/query"
          debug={true}
        >
          <AppContent />
        </ReduxAIProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
