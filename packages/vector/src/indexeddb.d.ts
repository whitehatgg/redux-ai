import type { VectorEntry } from './types';

export declare class IndexedDBStorage {
    private db: IDBDatabase | null;
    initialize(): Promise<void>;
    addEntry(entry: VectorEntry): Promise<void>;
    getAllEntries(): Promise<VectorEntry[]>;
    clear(): Promise<void>;
}