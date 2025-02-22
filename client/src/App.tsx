import { useState } from 'react';
import { ActivityLog, ChatBubble, ReduxAIProvider } from '@redux-ai/react';
import type { ReduxAIAction } from '@redux-ai/state';
import { QueryClientProvider } from '@tanstack/react-query';
import { RiAiGenerate, RiChatVoiceLine } from 'react-icons/ri';
import { SiOpenai } from 'react-icons/si';
import { Provider } from 'react-redux';

import { ApplicantTable } from './components/ApplicantTable';
import { queryClient } from './lib/queryClient';
import { store } from './store';
import {
  setSearchTerm as _setSearchTerm,
  setVisibleColumns as _setVisibleColumns,
  toggleSearch as _toggleSearch,
} from './store/slices/applicantSlice';

// Generate actions from slice's action creators
const actions: ReduxAIAction[] = [
  {
    type: 'applicant/setVisibleColumns',
    description: 'Control which columns are visible in the applicant table',
    keywords: [
      'show',
      'hide',
      'column',
      'field',
      'display',
      'visible',
      'table',
      'name',
      'email',
      'status',
      'position',
      'appliedDate',
      'disable',
      'enable',
    ],
  },
  {
    type: 'applicant/toggleSearch',
    description: 'Toggle search functionality on/off',
    keywords: ['enable', 'disable', 'search', 'toggle', 'switch'],
  },
  {
    type: 'applicant/setSearchTerm',
    description: 'Set search filter value to find specific applicants',
    keywords: ['search', 'find', 'filter', 'query', 'look', 'for'],
  },
];

function AppContent() {
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Redux AI
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground sm:text-2xl">
            Vibe coding your Redux store—let your users chat with your app using AI
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="https://github.com/whitehatgg/redux-ai"
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </a>
            <a
              href="#demo"
              className="inline-flex items-center rounded-lg bg-secondary px-6 py-3 text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              Try Demo
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
            <RiAiGenerate className="mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-xl font-semibold">AI-Powered State Enhancement</h3>
            <p className="text-muted-foreground">
              Extend your Redux store with intelligent interactions and natural language processing
              capabilities.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
            <SiOpenai className="mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-xl font-semibold">Powered by OpenAI</h3>
            <p className="text-muted-foreground">
              Leverages GPT-4 for intelligent state interpretation and action suggestions.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
            <RiChatVoiceLine className="mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-xl font-semibold">Natural Language Control</h3>
            <p className="text-muted-foreground">
              Interact with your Redux store using natural language commands and queries.
            </p>
          </div>
        </div>
      </div>

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
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ReduxAIProvider store={store} actions={actions} apiEndpoint="/api/query">
          <AppContent />
        </ReduxAIProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
