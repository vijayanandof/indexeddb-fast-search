import { FastIndexedDB } from '../src/core';
import { StoreSchema } from '../src/db'; // Import StoreSchema from db.ts
// Important: Import fake-indexeddb BEFORE using the library
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';
import FDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';
import { fail } from 'assert'; // Import Jest's fail function

// Mock the IndexedDB environment for Node.js
beforeAll(() => {
  // Inject fake-indexeddb
  (global as any).indexedDB = new FDBFactory();
  (global as any).IDBKeyRange = FDBKeyRange;
});

// Clear databases between tests
// Placed outside describe block to run after ALL tests in the file
// Note: If dbInstance fails creation in beforeEach, it might be undefined here.
afterEach(async () => {
    // Clear the fake databases regardless of dbInstance state
    const dbs = await (global as any).indexedDB.databases();
    await Promise.all(dbs.map((dbInfo: { name?: string; version?: number }) => 
        new Promise<void>((resolve, reject) => {
            if (dbInfo.name) {
                // Use the version from dbInfo if available, otherwise null/undefined is fine for deleteDatabase
                const deleteRequest = (global as any).indexedDB.deleteDatabase(dbInfo.name);
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = (e: Event) => {
                    console.error(`Failed to delete DB: ${dbInfo.name}`, deleteRequest.error);
                    reject(deleteRequest.error); // Reject on actual error
                };
                deleteRequest.onblocked = (e: Event) => {
                    // Log block, but resolve as fake-indexeddb might block during cleanup
                    console.warn(`Database deletion blocked for ${dbInfo.name}, attempting to proceed with cleanup.`);
                    resolve(); 
                };
            } else {
                resolve(); // Resolve if name is somehow undefined
            }
        })
    ));
});

// --- Test Data and Schema ---
interface TestUser {
    id?: number; // Auto-incrementing key
    name: string;
    age: number;
    email: string;
}

const testSchema: StoreSchema[] = [
    {
        name: 'users',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
            { name: 'by_name', keyPath: 'name' },
            { name: 'by_age', keyPath: 'age' },
            { name: 'by_email', keyPath: 'email', options: { unique: true } },
        ]
    }
];

const dbName = 'TestDB';
const dbVersion = 1;

// --- Test Suite ---
describe('FastIndexedDB', () => {
    let dbInstance: FastIndexedDB;

    beforeEach(async () => {
        // Create a new instance for each test to ensure isolation
        // DO NOT add records here - it interferes with tests expecting a clean slate or specific IDs
        dbInstance = new FastIndexedDB(dbName, dbVersion, testSchema);
    });

    // NOTE: This afterEach block structure seems okay for fake-indexeddb cleanup.
    // The primary issue was the beforeEach interference.
    afterEach(async () => {
        // Ensure the instance is closed before attempting cleanup
        if (dbInstance) {
            dbInstance.close(); 
        }
        // Clear the fake databases regardless of dbInstance state
        const dbs = await (global as any).indexedDB.databases();
        await Promise.all(dbs.map((dbInfo: { name?: string; version?: number }) => 
            new Promise<void>((resolve, reject) => {
                if (dbInfo.name) {
                    // Use the version from dbInfo if available, otherwise null/undefined is fine for deleteDatabase
                    const deleteRequest = (global as any).indexedDB.deleteDatabase(dbInfo.name);
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = (e: Event) => {
                        console.error(`Failed to delete DB: ${dbInfo.name}`, deleteRequest.error);
                        reject(deleteRequest.error); // Reject on actual error
                    };
                    deleteRequest.onblocked = (e: Event) => {
                        // Log block, but resolve as fake-indexeddb might block during cleanup
                        console.warn(`Database deletion blocked for ${dbInfo.name}, attempting to proceed with cleanup.`);
                        resolve(); 
                    };
                } else {
                    resolve(); // Resolve if name is somehow undefined
                }
            })
        ));
    });

    // --- Basic CRUD Operations ---

    test('should initialize and open the database', async () => {
        // Verify by performing a simple operation - add implicitly opens/initializes
        const key = await dbInstance.add('users', { name: 'InitTest', age: 99, email: 'init@test.com' });
        expect(key).toBeDefined(); // Check if add succeeded (returned a key)
        const retrieved = await dbInstance.get<TestUser>('users', key); // Use the actual key
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('InitTest');
    });

    test('should add and get a record', async () => {
        const user: TestUser = { name: 'Alice', age: 30, email: 'alice@example.com' };
        const key = await dbInstance.add('users', user);
        expect(key).toBe(1); // First auto-incremented key

        const retrievedUser = await dbInstance.get<TestUser>('users', key);
        expect(retrievedUser).toBeDefined();
        expect(retrievedUser?.id).toBe(key);
        expect(retrievedUser?.name).toBe('Alice');
    });

    test('should fail to add record with existing unique index value', async () => {
        const user1: TestUser = { name: 'Alice', age: 30, email: 'alice@example.com' };
        const user2: TestUser = { name: 'Bob', age: 25, email: 'alice@example.com' }; // Same email
        await dbInstance.add('users', user1);
        await expect(dbInstance.add('users', user2)).rejects.toBeDefined();
    });

    test('should put (add or update) a record', async () => {
        const user: TestUser = { name: 'Alice', age: 30, email: 'alice@example.com' };
        const key1 = await dbInstance.put('users', user);
        expect(key1).toBe(1);

        const userUpdate = { id: 1, name: 'Alice Smith', age: 31, email: 'alice.smith@example.com' };
        const key2 = await dbInstance.put('users', userUpdate); // Should update based on id
        expect(key2).toBe(1);

        const retrievedUser = await dbInstance.get<TestUser>('users', 1);
        expect(retrievedUser?.name).toBe('Alice Smith');
        expect(retrievedUser?.age).toBe(31);
        expect(retrievedUser?.email).toBe('alice.smith@example.com');
    });

    test('should get all records', async () => {
        await dbInstance.add('users', { name: 'Alice', age: 30, email: 'alice@example.com' });
        await dbInstance.add('users', { name: 'Bob', age: 25, email: 'bob@example.com' });
        const allUsers = await dbInstance.getAll<TestUser>('users');
        expect(allUsers).toHaveLength(2);
        expect(allUsers[0].name).toBe('Alice');
        expect(allUsers[1].name).toBe('Bob');
    });

    test('should delete a record', async () => {
        const key = await dbInstance.add('users', { name: 'Alice', age: 30, email: 'alice@example.com' });
        let user = await dbInstance.get('users', key);
        expect(user).toBeDefined();

        await dbInstance.delete('users', key);
        user = await dbInstance.get('users', key);
        expect(user).toBeUndefined();
    });

    test('should clear a store', async () => {
        await dbInstance.add('users', { name: 'Alice', age: 30, email: 'alice@example.com' });
        await dbInstance.add('users', { name: 'Bob', age: 25, email: 'bob@example.com' });
        let allUsers = await dbInstance.getAll<TestUser>('users');
        expect(allUsers).toHaveLength(2);

        await dbInstance.clear('users');
        allUsers = await dbInstance.getAll<TestUser>('users');
        expect(allUsers).toHaveLength(0);
    });

    // --- Search Tests ---
    describe('Search Operations', () => {
        // This beforeEach will only run before tests inside this describe block
        beforeEach(async () => {
            // Seed data specifically for search tests
            await dbInstance.put('users', { name: 'Alice', age: 30, email: 'alice@example.com' }); // id: 1
            await dbInstance.put('users', { name: 'Bob', age: 25, email: 'bob@example.com' });     // id: 2
            await dbInstance.put('users', { name: 'Charlie', age: 30, email: 'charlie@example.com' });// id: 3
            await dbInstance.put('users', { name: 'David', age: 40, email: 'david@example.com' });   // id: 4
        });

        test('should find records by exact index match (findByIndex)', async () => {
            const usersAge30 = await dbInstance.findByIndex<TestUser>('users', 'by_age', 30);
            expect(usersAge30).toHaveLength(2);
            expect(usersAge30.map(u => u.name)).toEqual(expect.arrayContaining(['Alice', 'Charlie']));
    
            const userBob = await dbInstance.findByIndex<TestUser>('users', 'by_name', 'Bob');
            expect(userBob).toHaveLength(1);
            expect(userBob[0].email).toBe('bob@example.com');
        });
    
        test('should count records by index (countByIndex)', async () => {
            const countAge30 = await dbInstance.countByIndex('users', 'by_age', IDBKeyRange.only(30));
            expect(countAge30).toBe(2);
    
            const totalCount = await dbInstance.countByIndex('users', 'by_age'); // Count all
            expect(totalCount).toBe(4);
        });
    
        test('should find records by index range (findByIndexRange)', async () => {
            // Ages between 25 and 35 (inclusive)
            const range = IDBKeyRange.bound(25, 35);
            const usersInRange = await dbInstance.findByIndexRange<TestUser>('users', 'by_age', { query: range });
            expect(usersInRange).toHaveLength(3);
            expect(usersInRange.map(u => u.name)).toEqual(expect.arrayContaining(['Alice', 'Bob', 'Charlie']));
        });
    
        test('should find records by index range with limit and offset', async () => {
            // All users sorted by age, skip 1, limit 2
            const usersPaginated = await dbInstance.findByIndexRange<TestUser>('users', 'by_age', {
                limit: 2,
                offset: 1
            });
            expect(usersPaginated).toHaveLength(2);
            // Default direction is 'next', so ages should be 30, 30
            expect(usersPaginated.map(u => u.age)).toEqual([30, 30]); 
            expect(usersPaginated.map(u => u.name)).toEqual(expect.arrayContaining(['Alice', 'Charlie']));
        });
    
        test('should find records by index range with direction (\'prev\')', async () => {
            // All users sorted by age descending
            const usersDesc = await dbInstance.findByIndexRange<TestUser>('users', 'by_age', {
                direction: 'prev'
            });
            expect(usersDesc).toHaveLength(4);
            // Ages should be 40, 30, 30, 25. Order of 30s might vary.
            const sortedAges = usersDesc.map(u => u.age).sort((a, b) => b - a);
            expect(sortedAges).toEqual([40, 30, 30, 25]);
            // Check names corresponding to ages
            expect(usersDesc.find(u => u.age === 40)?.name).toBe('David');
            expect(usersDesc.filter(u => u.age === 30).map(u => u.name)).toEqual(expect.arrayContaining(['Alice', 'Charlie']));
            expect(usersDesc.find(u => u.age === 25)?.name).toBe('Bob');
        });
    }); // End describe block for Search Operations

    // --- Schema Upgrade Test (keep outside search describe) ---
     test('should handle schema upgrades', async () => {
        // Add a record to v1 and close cleanly
        const preKey = await dbInstance.add('users', { name: 'PreUpgrade', age: 50, email: 'pre@upgrade.com' });
        expect(preKey).toBe(1);
        dbInstance.close();

        // Define v2 schema
        const v2Schema: StoreSchema[] = [
            {
                name: 'users',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'by_name', keyPath: 'name' },
                    { name: 'by_age', keyPath: 'age' },
                    { name: 'by_email', keyPath: 'email', options: { unique: true } },
                    { name: 'by_city', keyPath: 'city' } // New index
                ]
            },
            {
                name: 'products', // New store
                keyPath: 'sku'
            }
        ];

        let v2DbInstance: FastIndexedDB | null = null;
        try {
            // Attempt to open with the new version, triggering the upgrade
            v2DbInstance = new FastIndexedDB(dbName, 2, v2Schema);
            
            // Verify upgrade by adding data using new schema features
            const userKey = await v2DbInstance.add('users', { name: 'PostUpgrade', age: 51, email: 'post@upgrade.com', city: 'New City' });
            const productKey = await v2DbInstance.add('products', { sku: 'PROD-001', name: 'New Product' });

            // Verify data added to new structures
            const user = await v2DbInstance.get<TestUser & { city: string }>('users', userKey);
            expect(user).toBeDefined();
            expect(user?.city).toBe('New City'); // Verify new field
            
            const product = await v2DbInstance.get<{ name: string }>('products', productKey);
            expect(product).toBeDefined();
            expect(product?.name).toBe('New Product'); // Verify new store

            // Verify new index works
            const usersByCity = await v2DbInstance.findByIndex<TestUser & { city: string }>('users', 'by_city', 'New City');
            expect(usersByCity).toHaveLength(1);
            expect(usersByCity[0].name).toBe('PostUpgrade');

            console.log("[Test] Schema upgrade test using public API successful.");

        } catch (error) {
            console.error("[Test] Error during schema upgrade test:", error);
            fail(`Schema upgrade failed: ${(error as Error)?.message || error}`);
        } finally {
             if (v2DbInstance) {
                 v2DbInstance.close();
             }
        }
    });

}); 