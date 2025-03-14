import { BaseLLMProvider } from '@redux-ai/runtime';
import type { Message, CompletionResponse } from '@redux-ai/runtime/dist/types';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

export interface LangChainConfig {
  model: BaseChatModel;
  timeout?: number;
  debug?: boolean;
}

export class LangChainProvider extends BaseLLMProvider {
  private model: BaseChatModel;

  constructor(config: LangChainConfig) {
    super();
    this.model = config.model;
  }

  protected convertMessage(message: Message) {
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

  protected async completeRaw(messages: Message[]): Promise<CompletionResponse> {
    const langChainMessages = messages.map(msg => this.convertMessage(msg));
    const response = await this.model.invoke(langChainMessages);
    const content = response.content.toString();
    return JSON.parse(content);
  }

  public async complete(messages: Message[]): Promise<string> {
    const response = await this.completeRaw(messages);
    return response.message;
  }
}

export default LangChainProvider;