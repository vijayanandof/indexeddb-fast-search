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
export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;
  private stores: StoreSchema[];

  /**
   * Creates an instance of IndexedDBManager.
   * @param dbName - The name of the database.
   * @param version - The version of the database.
   * @param stores - An array defining the object stores and their schemas.
   * @throws If IndexedDB is not supported in the environment.
   */
  constructor(dbName: string, version: number, stores: StoreSchema[]) {
    // Check if IndexedDB API is available (works in browsers and Node with fake-indexeddb)
    const idb = typeof window !== 'undefined' ? window.indexedDB : global.indexedDB;
    if (!idb) {
      throw new Error('IndexedDB is not supported or polyfilled in this environment.');
    }
    this.dbName = dbName;
    this.dbVersion = version;
    this.stores = stores;
  }

  /**
   * Opens the IndexedDB database connection.
   * Handles creation and upgrades based on the provided schema.
   * @returns A promise resolving with the `IDBDatabase` instance.
   * @private
   */
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      console.log(`Attempting to open database '${this.dbName}' version ${this.dbVersion}`);
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error('IndexedDB error during open:', error);
        reject(`Database error: ${error?.message}`);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log(`Database '${this.dbName}' opened successfully (Version: ${this.db.version})`);

        // Add listener to close DB connection when the page/worker unloads
        if (typeof window !== 'undefined' && !window.IS_CLOSING_DB) {
          // Basic flag to avoid adding multiple listeners if openDB is called again
          window.IS_CLOSING_DB = true;
          window.addEventListener('beforeunload', () => this.close());
        }

        // Handle potential version change conflicts during success
        this.db.onversionchange = () => {
           console.warn(`Database version change detected for '${this.dbName}'. Closing connection.`);
           this.close();
           // Optional: Notify the application to reload or handle the change
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        console.log(`Upgrading database '${this.dbName}' from version ${(event as IDBVersionChangeEvent).oldVersion} to ${this.dbVersion}`);
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction;

        if (!transaction) {
          console.error('Upgrade transaction is null during onupgradeneeded.');
          reject('Upgrade transaction is null');
          return;
        }

        transaction.onerror = (errEvent) => {
          console.error('Error during database upgrade transaction:', transaction.error);
          reject(`Upgrade transaction error: ${transaction.error?.message}`);
        };

        // --- Schema Management --- 
        try {
            const existingStoreNames = Array.from(db.objectStoreNames);
            const desiredStoreNames = this.stores.map(s => s.name);

            // Delete stores not present in the new schema
            existingStoreNames.forEach(storeName => {
              if (!desiredStoreNames.includes(storeName)) {
                db.deleteObjectStore(storeName);
                console.log(`Deleted object store: ${storeName}`);
              }
            });

            // Create or update stores and indexes
            this.stores.forEach(storeSchema => {
              let store: IDBObjectStore;
              if (!existingStoreNames.includes(storeSchema.name)) {
                // Create new store
                store = db.createObjectStore(storeSchema.name, {
                  keyPath: storeSchema.keyPath,
                  autoIncrement: storeSchema.autoIncrement,
                });
                console.log(`Created object store: ${storeSchema.name}`);
              } else {
                // Get reference to existing store for index updates
                store = transaction.objectStore(storeSchema.name);
              }

              // Manage Indexes
              if (storeSchema.indexes) {
                const existingIndexNames = Array.from(store.indexNames);
                const desiredIndexNames = storeSchema.indexes.map(idx => idx.name);

                // Delete indexes not in the current schema for this store
                existingIndexNames.forEach(indexName => {
                  if (!desiredIndexNames.includes(indexName)) {
                    store.deleteIndex(indexName);
                    console.log(`Deleted index: ${indexName} from store: ${storeSchema.name}`);
                  }
                });

                // Create new indexes
                storeSchema.indexes.forEach(indexSchema => {
                  if (!existingIndexNames.includes(indexSchema.name)) {
                    store.createIndex(indexSchema.name, indexSchema.keyPath, indexSchema.options);
                    console.log(`Created index: ${indexSchema.name} on store: ${storeSchema.name}`);
                  }
                  // Note: Updating existing index options (like unique) typically requires deleting and recreating.
                  // This basic implementation only handles creation and deletion.
                });
              }
            });
            console.log(`Database '${this.dbName}' schema upgrade applied.`);
        } catch (e) {
            // Catch synchronous errors during schema manipulation
            console.error('Error applying schema changes during upgrade:', e);
            transaction.abort(); // Abort transaction on error
            reject(`Schema upgrade failed: ${(e as Error).message}`);
            return; // Stop further processing
        }
        // The upgrade transaction automatically commits, don't resolve here, wait for onsuccess
      };

      request.onblocked = (event) => {
        // Occurs if another tab has an older version of the DB open
        console.warn('IndexedDB open request blocked. Close other tabs connected to this database.', event);
        reject('Database connection is blocked. Please close other connections.');
      };
    });
  }

  /**
   * Gets the active `IDBDatabase` instance, opening or reopening the connection if necessary.
   * Includes a basic check to verify if the connection is still active.
   * @returns A promise resolving with the `IDBDatabase` instance.
   * @throws If the database connection cannot be established or re-established.
   */
  public async getDB(): Promise<IDBDatabase> {
    if (!this.db || !this.isConnectionAlive()) {
        console.log('Database connection not available or lost, attempting to open/reopen...');
        this.db = await this.openDB();
    }
    // The db should be valid here after awaiting openDB if it was null/closed
    return this.db!;
  }

  /**
   * Checks if the current database connection is likely still active.
   * This is a basic check; transactions might still fail.
   * @returns `true` if the connection seems active, `false` otherwise.
   * @private
   */
   private isConnectionAlive(): boolean {
       if (!this.db) return false;
       try {
           // A simple check: attempt to access objectStoreNames.
           // If the DB is closed, this might throw or return an empty list depending on the state.
           // A more robust check involves trying a transaction, but can be overkill.
           return this.db.objectStoreNames.length >= 0; 
       } catch (e) {
           // If accessing properties throws, the connection is likely closed.
           console.warn('Connection check failed, assuming connection is lost:', e);
           return false;
       }
   }

  /**
   * Gets an IndexedDB transaction for the specified stores and mode.
   * Ensures the database is connected before creating the transaction.
   * @param storeNames - The name(s) of the object store(s) to include in the transaction.
   * @param mode - The transaction mode (`readonly` or `readwrite`).
   * @returns A promise resolving with the `IDBTransaction` instance.
   */
  public async getTransaction(storeNames: string | string[], mode: IDBTransactionMode): Promise<IDBTransaction> {
    const db = await this.getDB();
    return db.transaction(storeNames, mode);
  }

  /**
   * Closes the active database connection.
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log(`Database '${this.dbName}' connection closed.`);
      // Clean up listener to prevent memory leaks
       if (typeof window !== 'undefined' && window.IS_CLOSING_DB) {
         window.IS_CLOSING_DB = false; // Reset flag
         // Note: Dynamically added event listeners might need explicit removal,
         // but 'beforeunload' is often handled okay by the browser closing the context.
         // Consider explicit removal if issues arise: window.removeEventListener('beforeunload', ...);
       }
    }
  }
}

// Add a simple flag to the window object for listener management
// This avoids issues with module scope if multiple instances are created somehow
declare global {
    interface Window {
        IS_CLOSING_DB?: boolean;
    }
} 