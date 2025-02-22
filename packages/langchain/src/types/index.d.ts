// Type definitions for langchain
// Re-export all module declarations

declare module 'langchain' {
  export * from './chat_models/base';
  export * from './schema';
}

declare module 'langchain/chat_models' {
  export * from './chat_models/base';
}

declare module 'langchain/chat_models/base' {
  import type { BaseMessage } from '../schema';

  export interface ChatModelCallOptions {
    maxTokens?: number;
    temperature?: number;
    stop?: string[];
  }

  export interface BaseChatModel {
    call(messages: BaseMessage[], options?: ChatModelCallOptions): Promise<{ text: string }>;
    temperature: number;
    maxTokens?: number;
    modelName: string;
  }
}

declare module 'langchain/schema' {
  export class BaseMessage {
    constructor(text: string);
    content: string;
    type: string;
  }

  export class HumanMessage extends BaseMessage {
    constructor(text: string);
    type: 'human';
  }

  export class SystemMessage extends BaseMessage {
    constructor(text: string);
    type: 'system';
  }

  export class AIMessage extends BaseMessage {
    constructor(text: string);
    type: 'ai';
  }

  export class FunctionMessage extends BaseMessage {
    constructor(text: string, name: string);
    type: 'function';
    name: string;
  }

  export type MessageType = 'human' | 'system' | 'ai' | 'function';
}
