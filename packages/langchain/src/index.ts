import type { CompletionResponse, LLMProvider, Message } from '@redux-ai/runtime';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

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
      const response = await this.model.invoke(langchainMessages);

      // Parse the response content
      let content: unknown;
      try {
        // Handle string responses
        if (typeof response.content === 'string') {
          try {
            content = JSON.parse(response.content);
          } catch {
            content = { message: response.content.trim(), action: null };
          }
        } else if (typeof response.content === 'object' && response.content !== null) {
          content = response.content;
        } else {
          throw new Error(`Unexpected response format: ${typeof response.content}`);
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

      return {
        message: typedContent.message,
        action: typedContent.action as Record<string, unknown> | null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`LangChain provider error: ${errorMessage}`);
    }
  }
}