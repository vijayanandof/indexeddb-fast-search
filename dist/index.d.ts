import { QueryBuilder } from './query-builder';
export interface StoreSchema {
    name: string;
    keyPath?: string;
    autoIncrement?: boolean;
    indexes?: Array<{
        name: string;
        keyPath: string | string[];
        options?: IDBIndexParameters;
    }>;
}
export declare class FastIndexedDB {
    private db;
    private dbName;
    private version;
    private schema;
    constructor(dbName: string, version: number, schema: StoreSchema[]);
    private getStore;
    private open;
    /**
     * Get a query builder for the specified store
     * @param storeName Name of the store to query
     */
    table<T>(storeName: string): QueryBuilder<T>;
    /**
     * Add a new record to the store
     * @param storeName Name of the store
     * @param data The data to store
     */
    add<T>(storeName: string, data: T): Promise<IDBValidKey>;
    /**
     * Add or update a record in the store
     * @param storeName Name of the store
     * @param data The data to store
     */
    put<T>(storeName: string, data: T): Promise<IDBValidKey>;
    /**
     * Get a record by its key
     * @param storeName Name of the store
     * @param key The key to look up
     */
    get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined>;
    /**
     * Get all records from a store
     * @param storeName Name of the store
     */
    getAll<T>(storeName: string): Promise<T[]>;
    /**
     * Delete a record by its key
     * @param storeName Name of the store
     * @param key The key to delete
     */
    delete(storeName: string, key: IDBValidKey): Promise<void>;
    /**
     * Find records by index
     * @param storeName Name of the store
     * @param indexName Name of the index
     * @param query The value to search for
     */
    findByIndex<T>(storeName: string, indexName: string, query: IDBValidKey): Promise<T[]>;
    /**
     * Find records by index range
     * @param storeName Name of the store
     * @param indexName Name of the index
     * @param options Query options including range and pagination
     */
    findByIndexRange<T>(storeName: string, indexName: string, options?: {
        query?: IDBKeyRange;
        limit?: number;
        offset?: number;
        direction?: IDBCursorDirection;
    }): Promise<T[]>;
    /**
     * Count records by index
     * @param storeName Name of the store
     * @param indexName Name of the index
     * @param query Optional query to filter by
     */
    countByIndex(storeName: string, indexName: string, query?: IDBKeyRange): Promise<number>;
    /**
     * Count the number of records in a store
     * @param storeName Name of the store to count
     */
    count(storeName: string): Promise<number>;
    /**
     * Clear all records from a store
     * @param storeName Name of the store to clear
     */
    clear(storeName: string): Promise<void>;
    /**
     * Close the database connection
     */
    close(): void;
}
//# sourceMappingURL=index.d.ts.map