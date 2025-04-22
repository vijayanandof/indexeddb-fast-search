// Re-export core functionality and necessary types
export type { IndexSchema } from './db';

// Optional: Decide if QueryBuilder is still needed/compatible or remove
// export { QueryBuilder } from './query-builder';

import { QueryBuilder } from './query-builder';

// Main entry point for the library
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

export class FastIndexedDB {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private version: number;
  private schema: StoreSchema[];

  constructor(dbName: string, version: number, schema: StoreSchema[]) {
    this.dbName = dbName;
    this.version = version;
    this.schema = schema;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.open();
    }
    const transaction = this.db!.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  private async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.schema.forEach((store) => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, {
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement,
            });

            store.indexes?.forEach((index) => {
              objectStore.createIndex(index.name, index.keyPath, index.options);
            });
          }
        });
      };
    });
  }

  /**
   * Get a query builder for the specified store
   * @param storeName Name of the store to query
   */
  table<T>(storeName: string): QueryBuilder<T> {
    return new QueryBuilder<T>(this, storeName);
  }

  /**
   * Add a new record to the store
   * @param storeName Name of the store
   * @param data The data to store
   */
  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add or update a record in the store
   * @param storeName Name of the store
   * @param data The data to store
   */
  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a record by its key
   * @param storeName Name of the store
   * @param key The key to look up
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records from a store
   * @param storeName Name of the store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a record by its key
   * @param storeName Name of the store
   * @param key The key to delete
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Find records by index
   * @param storeName Name of the store
   * @param indexName Name of the index
   * @param query The value to search for
   */
  async findByIndex<T>(storeName: string, indexName: string, query: IDBValidKey): Promise<T[]> {
    const store = await this.getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(query);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Find records by index range
   * @param storeName Name of the store
   * @param indexName Name of the index
   * @param options Query options including range and pagination
   */
  async findByIndexRange<T>(
    storeName: string,
    indexName: string,
    options: {
      query?: IDBKeyRange;
      limit?: number;
      offset?: number;
      direction?: IDBCursorDirection;
    } = {}
  ): Promise<T[]> {
    const store = await this.getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const results: T[] = [];
      const request = index.openCursor(options.query, options.direction);
      let count = 0;
      let skipped = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (options.offset && skipped < options.offset) {
            skipped++;
            cursor.continue();
            return;
          }

          if (options.limit && count >= options.limit) {
            resolve(results);
            return;
          }

          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records by index
   * @param storeName Name of the store
   * @param indexName Name of the index
   * @param query Optional query to filter by
   */
  async countByIndex(storeName: string, indexName: string, query?: IDBKeyRange): Promise<number> {
    const store = await this.getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.count(query);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count the number of records in a store
   * @param storeName Name of the store to count
   */
  async count(storeName: string): Promise<number> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all records from a store
   * @param storeName Name of the store to clear
   */
  async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
} 