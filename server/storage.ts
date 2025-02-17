import { users, type User, type InsertUser } from "@shared/schema";
import { ReduxAIVector } from "@redux-ai/vector";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getState(): Record<string, any>;
  storeInteraction(query: string, response: string, state: any): Promise<void>;
  getInteractions(): Promise<Array<{
    query: string;
    response: string;
    state: string;
    timestamp: string;
  }>>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vector: ReduxAIVector | null = null;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.initVectorStorage();
  }

  private async initVectorStorage() {
    try {
      this.vector = await ReduxAIVector.create({ collectionName: 'interactions' });
    } catch (error) {
      console.warn('Failed to initialize vector storage:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  getState(): Record<string, any> {
    return {
      users: Array.from(this.users.values()),
    };
  }

  async storeInteraction(query: string, response: string, state: any): Promise<void> {
    if (!this.vector) {
      throw new Error('Vector storage not initialized');
    }
    await this.vector.storeInteraction(query, response, state);
  }

  async getInteractions(): Promise<Array<{
    query: string;
    response: string;
    state: string;
    timestamp: string;
  }>> {
    if (!this.vector) {
      return [];
    }
    const results = await this.vector.retrieveSimilar('', 100); // Get all interactions
    return Array.isArray(results) ? results : [];
  }
}

export const storage = new MemStorage();