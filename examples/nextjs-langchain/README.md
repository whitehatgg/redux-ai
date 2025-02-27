# Next.js + LangChain Example

This example demonstrates how to use Redux AI with LangChain in a Next.js application, using the official @redux-ai/react components.

## Features

- Pre-built components from @redux-ai/react:
  - ChatBubble for chat interface
  - VectorDebugger for state inspection
- Integration with OpenAI's GPT-4 model through LangChain
- TypeScript support
- Tailwind CSS styling

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Set up your environment variables:
   Copy `.env.local.example` to `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=your-api-key-here
```

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── src/
│   ├── pages/
│   │   ├── api/
│   │   │   └── chat.ts      # Backend API endpoint
│   │   ├── _app.tsx         # App setup
│   │   └── index.tsx        # Main page using @redux-ai/react components
│   └── styles/
│       └── globals.css      # Global styles
├── next.config.js           # Next.js configuration
├── package.json
└── tsconfig.json
```

## Learn More

To learn more about Redux AI and LangChain, take a look at the following resources:

- [Redux AI Documentation](https://redux-ai.dev)
- [LangChain Documentation](https://js.langchain.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
