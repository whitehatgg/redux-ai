# Redux AI - Intelligent State Augmentation for Redux

A sophisticated augmentation layer for Redux that enhances your existing state management with intelligent features, focusing on AI-powered runtime middleware and intelligent state rehydration capabilities.

## Features

- 🧠 Intelligent Redux augmentation with modern TypeScript patterns
- 🔄 Chain-of-thought reasoning with comprehensive activity logging
- 🐛 Direct error propagation with transparent LLM error messages
- 📦 Framework adapters (Express.js, Next.js) with standardized APIs
- 🤖 OpenAI and LangChain integrations with JSON format support

## Quick Start

### Install Dependencies

```bash
pnpm install
pnpm build
```

### Basic Setup

```typescript
// server/config.ts
import { OpenAIProvider } from '@redux-ai/openai';
import { createRuntime } from '@redux-ai/runtime';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
  temperature: 0.7,
  maxTokens: 1000
});

export const runtime = createRuntime({
  provider
});
```

### Express Integration

```typescript
// server/routes.ts
import express from 'express';
import { ExpressAdapter } from '@redux-ai/express';
import { runtime } from './config';

const adapter = new ExpressAdapter();
const handler = await adapter.createHandler({ runtime });

app.post('/api/query', handler);
```

### Next.js Integration

```typescript
// pages/api/ai.ts
import { NextjsAdapter } from '@redux-ai/nextjs';
import { runtime } from '@/server/config';

export default async function handler(req, res) {
  const adapter = new NextjsAdapter();
  const handler = await adapter.createHandler({
    runtime,
    endpoint: '/api/ai'
  });

  return handler(req, res);
}
```

### Using Multiple Providers

You can use different LLM providers like OpenAI or LangChain:

```typescript
// OpenAI Provider
const openaiProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
  temperature: 0.7
});

// LangChain Provider
import { ChatOpenAI } from '@langchain/openai';
const model = new ChatOpenAI({ 
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o'
});

const langchainProvider = new LangChainProvider({
  model,
  timeout: 30000
});
```

### Making Queries

The runtime supports different types of queries:

```typescript
// Action Query
const actionResult = await runtime.query({
  query: 'create a new task called "Review PR"',
  actions: {
    createTask: {
      type: 'task/create',
      params: ['title']
    }
  }
});

// State Query
const stateResult = await runtime.query({
  query: 'show me all completed tasks',
  state: {
    tasks: [
      { id: 1, title: 'Review PR', completed: true },
      { id: 2, title: 'Update docs', completed: false }
    ]
  }
});

// Multi-step Workflow
const workflowResult = await runtime.query({
  query: 'search for John and disable the name column',
  actions: {
    search: {
      type: 'search',
      params: ['term']
    },
    setVisibleColumns: {
      type: 'setVisibleColumns',
      params: ['columns']
    }
  }
});
```

## Complete Example: Applicant Tracking System

Here's a practical example of how to use Redux AI with a React application to create an applicant tracking system:

### 1. Define Your Redux State Schema

```typescript
// client/src/store/schema.ts
import { z } from 'zod';

// Define the schema for individual applicants
export const applicantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(['new', 'interview', 'approved', 'rejected']),
  position: z.string(),
  appliedDate: z.string()
});

// Define available actions for Redux AI to use
export const actionSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('applicant/setSearchTerm'),
      payload: z.string()
    }),
    z.object({
      type: z.literal('applicant/selectApplicant'),
      payload: z.string().nullable()
    }),
    z.object({
      type: z.literal('applicant/approveApplicant'),
      payload: z.undefined().optional()
    }),
    // More actions...
  ]);

// Export the JSON schema for use with Redux AI
export const jsonActionSchema = zodToJsonSchema(actionSchema);
```

### 2. Create Redux Store with Reducer

```typescript
// client/src/store/slices/applicantSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ApplicantState } from '../schema';

// Initial state with mock data
const initialState: ApplicantState = {
  searchTerm: '',
  isSearchOpen: false,
  applicants: [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      status: 'new',
      position: 'Frontend Developer',
      appliedDate: '2025-03-15'
    },
    // More applicants...
  ],
  selectedApplicantId: null,
  // More state properties...
};

const applicantSlice = createSlice({
  name: 'applicant',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    selectApplicant: (state, action: PayloadAction<string | null>) => {
      state.selectedApplicantId = action.payload;
    },
    approveApplicant: (state) => {
      if (state.selectedApplicantId) {
        const applicant = state.applicants.find(a => a.id === state.selectedApplicantId);
        if (applicant) {
          applicant.status = 'approved';
        }
      }
    },
    // More reducers...
  }
});

export const { setSearchTerm, selectApplicant, approveApplicant } = applicantSlice.actions;
export default applicantSlice.reducer;
```

### 3. Set Up Redux AI Provider in Your React App

```typescript
// client/src/App.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReduxAIProvider } from '@redux-ai/react';
import { Switch, Route } from 'wouter';
import { store } from './store';
import { queryClient } from './lib/queryClient';
import { jsonActionSchema } from './store/schema';
import { ApplicantTable } from './components/ApplicantTable';
import { ApplicantDetail } from './components/ApplicantDetail';

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
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-16">
              <h2 className="text-center text-3xl font-bold mb-8">Applicant Tracking System</h2>
              <p className="text-center text-muted-foreground mb-8">
                Try Redux AI in action! Use the chat bubble to control the applicant system.
              </p>
              
              <Switch>
                <Route path="/applicant/:id" component={ApplicantDetail} />
                <Route path="/" component={ApplicantTable} />
              </Switch>
              
              {/* Chat bubble component would go here */}
            </div>
          </div>
        </ReduxAIProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
```

### 4. Configure Server-Side Handler

```typescript
// server/routes.ts
import { Express } from 'express';
import { ExpressAdapter } from '@redux-ai/express';
import { runtime } from './config';

export async function registerRoutes(app: Express) {
  const adapter = new ExpressAdapter();
  const handler = await adapter.createHandler({ runtime });
  
  // Register the Redux AI query endpoint
  app.post('/api/query', handler);
  
  // Add other routes as needed
}
```

### 5. Using Natural Language to Control Your App

With the setup above, users can now send natural language commands through the Redux AI interface. For example:

- "Show me all applicants"
- "Search for frontend developers"
- "Select applicant 1"
- "Approve the current applicant"
- "Schedule an interview for John Smith"
- "Reject the selected applicant"

Each of these commands will be processed by the Redux AI runtime, which will dispatch the appropriate actions to your Redux store, updating your application state accordingly.

## Architecture

The project uses a monorepo structure with the following packages:

### @redux-ai/runtime (Core)
- Standardized adapter interface with TypeScript types
- Chain-of-thought reasoning with activity logging
- Direct error propagation with full context
- Workflow processing for multi-step operations

### @redux-ai/express & @redux-ai/nextjs
- Framework-specific adapters with minimal integration code
- Direct error propagation from runtime
- Runtime configuration with environment variables

### @redux-ai/langchain & @redux-ai/openai
- Provider implementations for different LLM services
- JSON response format support
- Streaming capabilities where supported

## Development

### Building Packages

```bash
# Build all packages
pnpm build

# Build specific package
cd packages/<package-name> && pnpm build
```

### Running Tests

```bash
pnpm test
```

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT