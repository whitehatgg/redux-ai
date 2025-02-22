import type { BaseMessage } from './schema';

declare module 'langchain/chat_models/base' {
  export interface ChatModelCallOptions {
    /**
     * Maximum number of tokens to generate
     */
    maxTokens?: number;
    /**
     * Temperature controls randomness in generation
     * Higher values (e.g., 0.8) make output more random
     * Lower values (e.g., 0.2) make output more deterministic
     */
    temperature?: number;
    /**
     * Stop sequences to halt generation
     */
    stop?: string[];
  }

  export interface BaseChatModel {
    /**
     * Generate a chat completion for the given messages
     */
    call(messages: BaseMessage[], options?: ChatModelCallOptions): Promise<{ text: string }>;

    /**
     * Model temperature setting
     */
    temperature: number;

    /**
     * Maximum tokens to generate
     */
    maxTokens?: number;

    /**
     * Name/identifier of the model being used
     */
    modelName: string;
  }
}
