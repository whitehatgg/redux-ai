import { VectorStorage } from './storage';
import { IndexedDBStorage } from './indexeddb';
export class ReduxAIVector {
    constructor(storage, config) {
        this.storage = storage;
        this.maxEntries = config.maxEntries || 100;
    }
    static async create(config) {
        try {
            console.log('Initializing vector storage...');
            const storage = await VectorStorage.create();
            console.log('Vector storage initialized successfully');
            return new ReduxAIVector(storage, config);
        }
        catch (error) {
            console.error('Failed to initialize vector storage:', error);
            throw new Error(`Vector storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async storeInteraction(query, response, state) {
        try {
            console.log('Storing interaction:', { query, response });
            const stateString = typeof state === 'string' ? state : JSON.stringify(state, null, 2);
            const entry = {
                query,
                response,
                state: stateString,
                timestamp: new Date().toISOString(),
            };
            await this.storage.storeInteraction(query, response, state);
            console.log('Interaction stored successfully');
        }
        catch (error) {
            console.error('Error storing interaction:', error);
            throw error;
        }
    }
    async retrieveSimilar(query, limit = 5) {
        try {
            console.log('Retrieving similar interactions for query:', query);
            const results = await this.storage.retrieveSimilar(query, Math.min(limit, this.maxEntries));
            console.log('Retrieved similar interactions:', results);
            // Ensure we always return an array, even if empty
            return Array.isArray(results) ? results : [];
        }
        catch (error) {
            console.error('Error retrieving similar interactions:', error);
            return [];
        }
    }
    async getAllEntries() {
        try {
            const entries = await this.storage.getAllEntries();
            return Array.isArray(entries) ? entries : [];
        }
        catch (error) {
            console.error('Error getting all entries:', error);
            return [];
        }
    }
}
export const createReduxAIVector = async (config = {}) => {
    return ReduxAIVector.create(config);
};
export { IndexedDBStorage };
