import { BaseLLMProvider } from '@redux-ai/runtime';
import type { Message, ProviderConfig, IntentCompletionResponse } from '@redux-ai/runtime/dist/types';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';

export interface LangChainConfig extends ProviderConfig {
  model: BaseChatModel;
}

export class LangChainProvider extends BaseLLMProvider {
  private model: BaseChatModel;

  constructor(config: LangChainConfig) {
    super({
      timeout: config.timeout,
      debug: config.debug,
    });
    this.model = config.model;
  }

  protected convertMessage(message: Message): BaseMessage {
    switch (message.role) {
      case 'system':
        return new SystemMessage(message.content);
      case 'assistant':
        return new AIMessage(message.content);
      case 'user':
      default:
        return new HumanMessage(message.content);
    }
  }

  protected async completeRaw(messages: Message[]): Promise<IntentCompletionResponse> {
    try {
      const langChainMessages = messages.map(msg => this.convertMessage(msg));
      const response = await this.model.invoke(langChainMessages);
      const content = response.content.toString();

      // Basic intent classification
      if (content.toLowerCase().includes('show') || content.toLowerCase().includes('get')) {
        return {
          intent: 'state',
          message: content,
          reasoning: ['State request detected'],
          action: null
        };
      }

      if (content.toLowerCase().includes('create') || content.toLowerCase().includes('add')) {
        return {
          intent: 'action',
          message: content,
          reasoning: ['Action request detected'],
          action: { type: 'create' }
        };
      }

      return {
        intent: 'conversation',
        message: content,
        reasoning: ['General conversation'],
        action: null
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw error;
    }
  }

  public async complete(messages: Message[]): Promise<string> {
    try {
      const response = await this.completeRaw(messages);
      return response.message;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw error;
    }
  }
}

export default LangChainProvider;