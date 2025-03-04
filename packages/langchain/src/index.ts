import { BaseLLMProvider } from '@redux-ai/runtime';
import type { Message, ProviderConfig } from '@redux-ai/runtime/dist/types';
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

  protected async completeRaw(messages: Message[]): Promise<unknown> {
    if (this.debug) {
      console.debug('[LangChain] Converting messages:', messages);
    }

    const langChainMessages = messages.map(msg => this.convertMessage(msg));

    if (this.debug) {
      console.debug('[LangChain] Sending request with messages:', langChainMessages);
    }

    const response = await this.model.invoke(langChainMessages);

    if (this.debug) {
      console.debug('[LangChain] Received response:', response.content);
    }

    return response.content;
  }
}

export default LangChainProvider;
