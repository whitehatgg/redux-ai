# Redux AI - Intelligent State Augmentation for Redux

A sophisticated augmentation layer for Redux that enhances your existing state management with AI capabilities, enabling natural language control of your application state and UI. The library seamlessly integrates with your Redux store to provide intelligent features without requiring significant changes to your existing architecture.

## Features

- 🧠 Intelligent Redux augmentation with modern TypeScript patterns
- 🔄 Natural language processing of user intent with comprehensive logging
- 💬 Conversational interface for controlling complex application state
- 🐛 Direct error propagation with transparent LLM messaging
- 🏗️ Framework-agnostic design with Express.js and Next.js integrations

## AI Enhancement for Existing Applicant Tracking Systems

Redux AI doesn't create a new applicant tracking system - it enhances your existing one with powerful AI capabilities. Rather than replacing your carefully built ATS with yet another solution, Redux AI adds a layer of intelligence that works with your current system.

### Why Enhancement is Better Than Replacement

Traditional approaches to adding AI often involve building entirely new systems or complex integrations that disrupt existing workflows. Redux AI takes a different approach by:

1. **Preserving Your Investment**: Builds on top of your existing Redux state management
2. **Minimizing Disruption**: No need to retrain users on a completely new system
3. **Reducing Development Time**: Integration in hours/days instead of weeks/months
4. **Leveraging Established Patterns**: Works with your existing Redux actions and state

Below is an example of how Redux AI integrates with an established applicant tracking system to add natural language control:

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
  appliedDate: z.string(),
});

// Define available actions for Redux AI to use
export const actionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('applicant/setSearchTerm'),
    payload: z.string(),
  }),
  z.object({
    type: z.literal('applicant/selectApplicant'),
    payload: z.string().nullable(),
  }),
  z.object({
    type: z.literal('applicant/approveApplicant'),
    payload: z.undefined().optional(),
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
      appliedDate: '2025-03-15',
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
    approveApplicant: state => {
      if (state.selectedApplicantId) {
        const applicant = state.applicants.find(a => a.id === state.selectedApplicantId);
        if (applicant) {
          applicant.status = 'approved';
        }
      }
    },
    // More reducers...
  },
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

### 5. AI-Enhanced User Experience

With minimal integration effort, your existing applicant tracking system now gains powerful AI capabilities. Users can interact with the system through natural language, making complex operations more intuitive:

- "Show me all frontend developer applicants who applied in the last week"
- "Select John Smith's application and schedule an interview for next Tuesday"
- "Find candidates with React experience and filter by those in the interview stage"
- "Approve the current applicant and send them the standard offer letter"
- "Summarize all rejected applications from March and their feedback"

The Redux AI layer intelligently translates these requests into the appropriate sequence of Redux actions, executing complex workflows that would normally require multiple UI interactions. This enhances your existing UI without replacing it, allowing both traditional and AI-driven interactions to coexist seamlessly.

### Key Benefits for Existing ATS Systems

- **Zero-Modification Integration**: Add AI capabilities without rewriting your existing application code
- **Improved User Efficiency**: Complex multi-step workflows become single natural language commands
- **Enhanced Accessibility**: Users who struggle with complex UIs can interact naturally with the system
- **Gradual Adoption**: Introduce AI capabilities alongside traditional interfaces, allowing users to choose their preferred method
- **Future-Proof Architecture**: As your ATS evolves, Redux AI adapts to new actions and state structure

### Before and After: A Practical Demonstration

**Before Integration (Traditional ATS Workflow):**

1. Click on search field
2. Type "frontend developer"
3. Click search button
4. Sort results by application date
5. Filter to only show candidates in the "interview" stage
6. Open John Smith's profile
7. Click on "Schedule Interview" button
8. Select date and time from calendar widget
9. Add interview details in form
10. Submit form

**After Redux AI Enhancement:**

1. Type or speak: "Find frontend developers who are in the interview stage, sort by recent applications, and schedule an interview with John Smith for next Tuesday at 2pm"

Redux AI will handle the entire sequence, dispatching the right Redux actions in the correct order to accomplish the complex workflow in one natural language command.

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
