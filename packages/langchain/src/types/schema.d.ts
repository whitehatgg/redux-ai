declare module 'langchain/schema' {
  /**
   * Base message class that all message types extend from
   */
  export class BaseMessage {
    constructor(text: string);

    /**
     * The text content of the message
     */
    content: string;

    /**
     * The type/role of the message
     */
    type: string;
  }

  /**
   * Represents a message from the human/user
   */
  export class HumanMessage extends BaseMessage {
    constructor(text: string);
    type: 'human';
  }

  /**
   * Represents a system message that provides context or instructions
   */
  export class SystemMessage extends BaseMessage {
    constructor(text: string);
    type: 'system';
  }

  /**
   * Represents a message from the AI/assistant
   */
  export class AIMessage extends BaseMessage {
    constructor(text: string);
    type: 'ai';
  }

  /**
   * Represents a function calling message
   */
  export class FunctionMessage extends BaseMessage {
    constructor(text: string, name: string);
    type: 'function';
    name: string;
  }

  /**
   * Union type of all possible message types
   */
  export type MessageType = 'human' | 'system' | 'ai' | 'function';
}
