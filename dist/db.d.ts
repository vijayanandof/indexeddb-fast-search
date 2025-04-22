/**
 * Defines the structure for an IndexedDB Object Store.
 */
export interface StoreSchema {
    /** The name of the object store. */
    name: string;
    /** The key path for the store. See `IDBObjectStoreParameters`. */
    keyPath?: string | string[];
    /** Whether the store uses auto-incrementing keys. See `IDBObjectStoreParameters`. */
    autoIncrement?: boolean;
    /** An array of index definitions for this store. */
    indexes?: IndexSchema[];
}
/**
 * Defines the structure for an index within an IndexedDB Object Store.
 */
export interface IndexSchema {
    /** The name of the index. */
    name: string;
    /** The key path for the index. See `IDBObjectStore.createIndex`. */
    keyPath: string | string[];
    /** Options for the index (e.g., unique, multiEntry). See `IDBIndexParameters`. */
    options?: IDBIndexParameters;
}
/**
 * Manages the IndexedDB connection, schema upgrades, and transactions.
 * This class is intended for internal use by `FastIndexedDB`.
 * @internal
 */
export declare class IndexedDBManager {
    private db;
    private dbName;
    private dbVersion;
    private stores;
    /**
     * Creates an instance of IndexedDBManager.
     * @param dbName - The name of the database.
     * @param version - The version of the database.
     * @param stores - An array defining the object stores and their schemas.
     * @throws If IndexedDB is not supported in the environment.
     */
    constructor(dbName: string, version: number, stores: StoreSchema[]);
    /**
     * Opens the IndexedDB database connection.
     * Handles creation and upgrades based on the provided schema.
     * @returns A promise resolving with the `IDBDatabase` instance.
     * @private
     */
    private openDB;
    /**
     * Gets the active `IDBDatabase` instance, opening or reopening the connection if necessary.
     * Includes a basic check to verify if the connection is still active.
     * @returns A promise resolving with the `IDBDatabase` instance.
     * @throws If the database connection cannot be established or re-established.
     */
    getDB(): Promise<IDBDatabase>;
    /**
     * Checks if the current database connection is likely still active.
     * This is a basic check; transactions might still fail.
     * @returns `true` if the connection seems active, `false` otherwise.
     * @private
     */
    private isConnectionAlive;
    /**
     * Gets an IndexedDB transaction for the specified stores and mode.
     * Ensures the database is connected before creating the transaction.
     * @param storeNames - The name(s) of the object store(s) to include in the transaction.
     * @param mode - The transaction mode (`readonly` or `readwrite`).
     * @returns A promise resolving with the `IDBTransaction` instance.
     */
    getTransaction(storeNames: string | string[], mode: IDBTransactionMode): Promise<IDBTransaction>;
    /**
     * Closes the active database connection.
     */
    close(): void;
}
declare global {
    interface Window {
        IS_CLOSING_DB?: boolean;
    }
}
//# sourceMappingURL=db.d.ts.map