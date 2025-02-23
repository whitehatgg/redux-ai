# Next.js + LangChain Example

This example demonstrates how to use Redux AI with LangChain in a Next.js application.

## Features

- Integration with OpenAI's GPT-4o model through LangChain
- Real-time chat interface
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

## How it Works

This example demonstrates:

- Setting up LangChainProvider with ChatOpenAI
- Making chat completions with proper error handling
- Managing chat state with React hooks
- Proper TypeScript integration
- Responsive UI with Tailwind CSS

## Learn More

To learn more about Redux AI and LangChain, take a look at the following resources:

- [Redux AI Documentation](https://redux-ai.dev)
- [LangChain Documentation](https://js.langchain.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
