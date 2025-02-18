import { IndexedDBStorage } from './indexeddb';
export class VectorStorage {
    constructor(storage) {
        this.storage = storage;
    }
    static async create() {
        try {
            console.log('Initializing vector storage...');
            const storage = new IndexedDBStorage();
            await storage.initialize();
            console.log('Vector storage initialized successfully');
            return new VectorStorage(storage);
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
            await this.storage.addEntry(entry);
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
            const entries = await this.getAllEntries();
            if (entries.length === 0) {
                console.log('No entries found in storage');
                return [];
            }
            // For now, we'll just return the most recent interactions
            // In a future update, we can implement more sophisticated similarity matching
            const sortedEntries = entries
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, Math.min(limit, entries.length));
            console.log(`Retrieved ${sortedEntries.length} similar interactions`);
            return sortedEntries;
        }
        catch (error) {
            console.error('Error retrieving similar interactions:', error);
            return [];
        }
    }
    async getAllEntries() {
        try {
            console.log('Getting all entries from storage');
            const entries = await this.storage.getAllEntries();
            if (!Array.isArray(entries)) {
                console.warn('Storage returned non-array entries, converting to array');
                return [];
            }
            console.log(`Retrieved ${entries.length} entries from storage`);
            return entries;
        }
        catch (error) {
            console.error('Failed to get all entries:', error);
            return [];
        }
    }
}
export const createReduxAIVector = async (config = {}) => {
    return ReduxAIVector.create(config);
};
export { IndexedDBStorage };
