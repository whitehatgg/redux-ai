import { VectorStorage } from './storage';

export interface VectorConfig {
  collectionName: string;
}

export class ReduxAIVector {
  private storage: VectorStorage;

  private constructor(storage: VectorStorage) {
    this.storage = storage;
  }

  static async create(config: VectorConfig): Promise<ReduxAIVector> {
    const storage = await VectorStorage.create(config.collectionName);
    return new ReduxAIVector(storage);
  }

  async storeInteraction(query: string, response: string, state: any) {
    // Ensure state is properly stringified for storage
    const stateString = typeof state === 'string' ? state : JSON.stringify(state, null, 2);

    await this.storage.addEntry({
      query,
      response,
      state: stateString,
      timestamp: new Date().toISOString(),
    });
  }

  async retrieveSimilar(query: string, limit: number = 5) {
    try {
      return await this.storage.retrieveSimilar(query, limit);
    } catch (error) {
      console.error('Error retrieving similar interactions:', error);
      return [];
    }
  }
}

export const createReduxAIVector = async (config: VectorConfig) => {
  return ReduxAIVector.create(config);
};