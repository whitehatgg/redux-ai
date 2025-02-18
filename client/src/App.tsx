import { Provider } from 'react-redux';
import { store } from './store';
import { ChatBubble, ActivityLog, ReduxAIProvider } from '@redux-ai/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import type { ReduxAIAction } from '@redux-ai/state';
import { ApplicantTable } from './components/ApplicantTable';
import { useState } from 'react';
import { RiAiGenerate, RiChatVoiceLine } from "react-icons/ri";
import { SiOpenai } from "react-icons/si";
import { Code } from "@/components/ui/code";

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
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Redux AI
          </h1>
          <p className="text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Vibe coding your Redux store—let your users chat with your app using AI
          </p>
          <div className="flex justify-center gap-4">
            <a href="https://github.com/yourusername/redux-ai" className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Get Started
            </a>
            <a href="#demo" className="inline-flex items-center px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors">
              Try Demo
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <RiAiGenerate className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Agentic State Management</h3>
            <p className="text-muted-foreground">
              Let AI understand and manage your Redux store through natural language interactions.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <SiOpenai className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Powered by OpenAI</h3>
            <p className="text-muted-foreground">
              Leverages GPT-4 for intelligent state understanding and action dispatching.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <RiChatVoiceLine className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Natural Language Control</h3>
            <p className="text-muted-foreground">
              Control your app's state using simple English commands and queries.
            </p>
          </div>
        </div>
      </div>

      {/* Code Example Section */}
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-8">Quick Start</h2>
        <div className="max-w-3xl mx-auto">
          <Code className="text-sm">
{`// Initialize Redux AI
const reduxAI = await createReduxAIState({
  store,
  availableActions: [
    {
      type: 'counter/increment',
      description: 'Increase the counter',
      keywords: ['increase', 'add', 'increment']
    }
  ]
});

// Process natural language queries
await reduxAI.processQuery("increase the counter");`}
          </Code>
        </div>
      </div>

      {/* Demo Section */}
      <div id="demo" className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-8">Live Demo</h2>
        <p className="text-center text-muted-foreground mb-8">
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