import type { Express } from "express";
import { createServer } from "http";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express) {
  // Add health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).send('OK');
  });

  app.post('/api/query', async (req, res) => {
    try {
      const { query, state, availableActions, previousInteractions = [] } = req.body;

      console.log('Received query:', query);
      console.log('Available actions:', availableActions);

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }

      // Format previous interactions for context
      const conversationHistory = previousInteractions
        .map((interaction: any) => `User: ${interaction.query}\nAssistant: ${interaction.response}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps users interact with a Redux application through natural language.

Your primary task is to understand user queries and map them to appropriate Redux actions.

When analyzing queries:
1. Look for key verbs and nouns that indicate user intent
2. Map that intent to available actions
3. Extract relevant parameters for the action payload
4. Construct a clear response explaining what will be done

For example, when users mention:
- "search" or "find" -> Look for actions related to search/filtering
- "show" or "hide" -> Look for actions related to visibility
- "enable" or "disable" -> Look for toggle actions

Available Actions:
${JSON.stringify(availableActions, null, 2)}

Current Application State:
${JSON.stringify(state, null, 2)}

Previous Conversation:
${conversationHistory}

You must ALWAYS return a JSON response in this format:
{
  "message": "A clear explanation of what action will be taken",
  "action": {
    "type": "one of the available action types",
    "payload": "appropriate payload based on the query"
  }
}

If no matching action is found, return:
{
  "message": "I couldn't find an appropriate action for your request. Here's why...",
  "action": null
}

Focus on:
1. Understanding the user's intent from their natural language query
2. Matching that intent to the most appropriate available action
3. Constructing the correct payload for that action
4. Providing clear feedback about what will be done`
          },
          {
            role: "user",
            content: query
          }
        ],
        response_format: { type: "json_object" }
      });

      if (!response.choices[0].message.content) {
        throw new Error('Invalid response format from AI');
      }

      console.log('OpenAI Response:', response.choices[0].message.content);
      const content = JSON.parse(response.choices[0].message.content);

      res.json({ 
        message: content.message,
        action: content.action || null
      });
    } catch (error: unknown) {
      console.error('Error processing query:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}