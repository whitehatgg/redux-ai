import type { CompletionResponse, LLMProvider, Message } from '@redux-ai/runtime';
import type { BaseChatModel } from 'langchain/chat_models/base';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';

export interface LangChainConfig {
  model: BaseChatModel;
}

export class LangChainProvider implements LLMProvider {
  private model: BaseChatModel;

  constructor(config: LangChainConfig) {
    this.model = config.model;
  }

  async complete(
    messages: Message[],
    _currentState?: Record<string, unknown>
  ): Promise<CompletionResponse> {
    try {
      // Convert messages to LangChain format
      const langchainMessages = messages.map(msg => {
        switch (msg.role) {
          case 'system':
            return new SystemMessage(msg.content);
          case 'assistant':
            return new AIMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      });

      // Add system message for JSON formatting if not present
      if (!messages.some(msg => msg.role === 'system')) {
        langchainMessages.unshift(
          new SystemMessage(
            'Always respond with valid JSON that includes a "message" field for the response text and an optional "action" field for Redux actions. Example: { "message": "Hello", "action": null }'
          )
        );
      }

      // Invoke the model and get response
      const response = await this.model.call(langchainMessages);

      // Parse the response content
      let content: unknown;
      try {
        // Handle string responses
        if (typeof response.text === 'string') {
          // Check if the response is already JSON
          try {
            content = JSON.parse(response.text);
          } catch {
            // If not JSON, wrap the text in a message object
            content = { message: response.text.trim(), action: null };
          }
        }
        // Handle object responses
        else if (typeof response.text === 'object' && response.text !== null) {
          content = response.text;
        } else {
          throw new Error(`Unexpected response format: ${typeof response.text}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to parse model response: ${errorMessage}`);
      }

      // Validate response format
      if (!content || typeof content !== 'object') {
        throw new Error('Invalid response: not an object');
      }

      const typedContent = content as Record<string, unknown>;
      if (typeof typedContent.message !== 'string') {
        throw new Error('Invalid response: missing or invalid message field');
      }

      // Ensure action is either a non-empty object or null
      const action = typedContent.action;
      const validatedAction =
        action && typeof action === 'object' && Object.keys(action).length > 0
          ? (action as Record<string, unknown>)
          : null;

      return {
        message: typedContent.message,
        action: validatedAction,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`LangChain provider error: ${errorMessage}`);
    }
  }
}
