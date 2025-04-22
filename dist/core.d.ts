import { StoreSchema } from './db';
/**
 * Main class providing a simple and efficient API for interacting with IndexedDB.
 *
 * Offers Promise-based methods for common database operations (CRUD) and
 * indexed searches.
 *
 * @example
 * ```typescript
 * import { FastIndexedDB, StoreSchema } from 'indexeddb-fast-search';
 *
 * interface User {
 *   id?: number;
 *   name: string;
 *   age: number;
 * }
 *
 * const userSchema: StoreSchema = {
 *   name: 'users', // Object store name
 *   keyPath: 'id',   // Primary key property
 *   autoIncrement: true,
 *   indexes: [
 *     { name: 'by_name', keyPath: 'name' }, // Index on the 'name' property
 *     { name: 'by_age', keyPath: 'age' },   // Index on the 'age' property
 *   ],
 * };
 *
 * const db = new FastIndexedDB('MyDatabase', 1, [userSchema]);
 *
 * async function run() {
 *   try {
 *     const userId = await db.add<User>('users', { name: 'Alice', age: 30 });
 *     console.log('Added user with ID:', userId);
 *
 *     const alice = await db.get<User>('users', userId);
 *     console.log('Retrieved user:', alice);
 *
 *     const usersByName = await db.findByIndex<User>('users', 'by_name', 'Alice');
 *     console.log('Users named Alice:', usersByName);
 *
 *   } catch (error) {
 *     console.error('Database operation failed:', error);
 *   } finally {
 *     db.close(); // Close connection when done
 *   }
 * }
 *
 * run();
 * ```
 */
export declare class FastIndexedDB {
    private manager;
    /**
     * Creates a new FastIndexedDB instance.
     *
     * This constructor initializes the database connection manager but doesn't
     * immediately open the database. The connection is opened on the first
     * operation that requires it (e.g., `add`, `get`, `findByIndex`).
     *
     * @param dbName - The name for the IndexedDB database.
     * @param version - The version of the database schema. Increment this number when making changes to `stores`.
     * @param stores - An array of `StoreSchema` objects defining the object stores and their indexes.
     * @throws If IndexedDB is not supported in the current environment.
     */
    constructor(dbName: string, version: number, stores: StoreSchema[]);
    /**
     * Adds a new record to the specified object store.
     *
     * This method uses the underlying `IDBObjectStore.add()` method.
     * It will **reject** if a record with the same key already exists in the store.
     * If you want to add or update, use the `put` method instead.
     *
     * @template T - The type of the data object being added.
     * @param storeName - The name of the object store to add the record to.
     * @param data - The data object to add. If the store uses `autoIncrement`, the key path property can be omitted.
     * @returns A promise resolving with the key of the newly added record.
     * @throws Rejects if a record with the same key exists or if the transaction fails.
     */
    add<T>(storeName: string, data: T): Promise<IDBValidKey>;
    /**
     * Adds or updates a record in the specified object store.
     *
     * This method uses the underlying `IDBObjectStore.put()` method.
     * If a record with the same key already exists, it will be **overwritten**.
     * If no record with the key exists, a new record will be created.
     *
     * @template T - The type of the data object being added or updated.
     * @param storeName - The name of the object store.
     * @param data - The data object to add or update. If the store uses a key path, the key must be present in the object.
     * @returns A promise resolving with the key of the added or updated record.
     * @throws Rejects if the transaction fails.
     */
    put<T>(storeName: string, data: T): Promise<IDBValidKey>;
    /**
     * Retrieves a record by its key from the specified object store.
     *
     * @template T - The expected type of the retrieved record.
     * @param storeName - The name of the object store.
     * @param key - The key of the record to retrieve.
     * @returns A promise resolving with the record data if found, or `undefined` if no record matches the key.
     * @throws Rejects if the transaction fails.
     */
    get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined>;
    /**
     * Retrieves all records from the specified object store.
     *
     * **Warning:** This can be inefficient and consume significant memory for very large object stores.
     * Consider using `findByIndexRange` with pagination (limit/offset) for large datasets.
     *
     * @template T - The expected type of the records in the store.
     * @param storeName - The name of the object store.
     * @returns A promise resolving with an array containing all records from the store.
     * @throws Rejects if the transaction fails.
     */
    getAll<T>(storeName: string): Promise<T[]>;
    /**
     * Deletes a record by its key from the specified object store.
     *
     * @param storeName - The name of the object store.
     * @param key - The key of the record to delete.
     * @returns A promise resolving when the deletion transaction is complete.
     * @throws Rejects if the transaction fails.
     */
    delete(storeName: string, key: IDBValidKey): Promise<void>;
    /**
     * Clears all records from the specified object store.
     *
     * **Warning:** This operation permanently removes all data from the store.
     *
     * @param storeName - The name of the object store to clear.
     * @returns A promise resolving when the clear transaction is complete.
     * @throws Rejects if the transaction fails.
     */
    clear(storeName: string): Promise<void>;
    /**
     * Explicitly closes the database connection.
     *
     * It's good practice to call this when your application is shutting down
     * or no longer needs the database, although the library attempts to handle
     * cleanup automatically on page unload where possible.
     */
    close(): void;
    /**
     * Finds all records in an object store where the value of a specified index matches the given query exactly.
     *
     * @template T - The expected type of the records.
     * @param storeName - The name of the object store.
     * @param indexName - The name of the index to search on.
     * @param query - The exact value to match against the index.
     * @returns A promise resolving with an array of matching records.
     * @throws Rejects if the store or index doesn't exist, or the transaction fails.
     */
    findByIndex<T>(storeName: string, indexName: string, query: IDBValidKey): Promise<T[]>;
    /**
     * Finds records in an object store where the value of a specified index falls within a given range.
     * Supports pagination (limit/offset) and ordering.
     *
     * @template T - The expected type of the records.
     * @param storeName - The name of the object store.
     * @param indexName - The name of the index to search on.
     * @param options - Optional parameters to control the query.
     * @param options.query - An `IDBKeyRange` or a single key value. If `null` or `undefined`, iterates over the entire index.
     *   Use `IDBKeyRange` static methods (`only`, `bound`, `lowerBound`, `upperBound`) to create ranges.
     * @param options.direction - The direction of iteration (`'next'`, `'prev'`, `'nextunique'`, `'prevunique'`). Defaults to `'next'`.
     * @param options.limit - The maximum number of records to return. Defaults to `Infinity`.
     * @param options.offset - The number of records to skip from the beginning of the result set (requires cursor iteration). Defaults to 0.
     * @returns A promise resolving with an array of matching records, ordered according to the specified direction.
     * @throws Rejects if the store or index doesn't exist, or the transaction fails.
     */
    findByIndexRange<T>(storeName: string, indexName: string, options?: {
        query?: IDBKeyRange | IDBValidKey | null;
        direction?: IDBCursorDirection;
        limit?: number;
        offset?: number;
    }): Promise<T[]>;
    /**
     * Counts records in an object store where the value of a specified index matches a query or falls within a range.
     *
     * @param storeName - The name of the object store.
     * @param indexName - The name of the index to count on.
     * @param query - Optional: An `IDBKeyRange` or a single key value to count. If omitted, counts all records accessible by the index.
     * @returns A promise resolving with the number of matching records.
     * @throws Rejects if the store or index doesn't exist, or the transaction fails.
     */
    countByIndex(storeName: string, indexName: string, query?: IDBKeyRange | IDBValidKey): Promise<number>;
}
//# sourceMappingURL=core.d.ts.map