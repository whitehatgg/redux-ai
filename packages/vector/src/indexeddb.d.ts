import { VectorEntry } from './storage';
export declare class IndexedDBStorage {
    private db;
    initialize(): Promise<void>;
    addEntry(entry: VectorEntry): Promise<void>;
    getAllEntries(): Promise<VectorEntry[]>;
    clear(): Promise<void>;
}
