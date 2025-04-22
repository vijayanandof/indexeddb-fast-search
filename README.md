# IndexedDB Fast Search ✨

[![Node.js CI](https://github.com/vijanandof/indexeddb-fast-search/actions/workflows/ci.yml/badge.svg)](https://github.com/vijayanandof/indexeddb-fast-search/actions/workflows/ci.yml) <!-- Replace with your actual badge URL -->
[![npm version](https://badge.fury.io/js/indexeddb-fast-search.svg)](https://badge.fury.io/js/indexeddb-fast-search) <!-- Replace with your actual npm package name if different -->
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A lightweight, Promise-based, and fast IndexedDB wrapper focused on efficient searching and ease of use, written in TypeScript.

## Features

*   🚀 **Promise-based API:** Modern `async/await` syntax for all operations.
*   ⚙️ **Simple Schema Definition:** Easily define object stores and indexes.
*   🔍 **Indexed Searching:** Fast lookups using `findByIndex` and `findByIndexRange`.
*   📄 **Pagination & Ordering:** Built-in support for limiting, offsetting, and ordering search results.
*   🛡️ **TypeScript Native:** Fully typed for better developer experience and safety.
*   🏗️ **Automatic Schema Migrations:** Handles basic store and index creation/deletion during version upgrades.
*   📦 **Multiple Module Formats:** Provides ESM, CJS, and UMD builds.

## Installation

```bash
npm install indexeddb-fast-search
# or
yarn add indexeddb-fast-search
```

## Usage

Here's a basic example demonstrating how to define a schema, add data, and perform searches:

```typescript
import { FastIndexedDB, StoreSchema } from 'indexeddb-fast-search';

// 1. Define an interface for your data
interface Book {
  isbn?: string; // Primary key (can be optional if not auto-incrementing)
  title: string;
  author: string;
  publishedYear: number;
  genres: string[];
}

// 2. Define the database schema
const librarySchema: StoreSchema[] = [
  {
    name: 'books',          // Object store name
    keyPath: 'isbn',       // Property to use as the primary key
 // autoIncrement: false, // Default is false
    indexes: [
      // Create indexes for fields you want to search efficiently
      { name: 'by_title', keyPath: 'title' },
      { name: 'by_author', keyPath: 'author' },
      { name: 'by_year', keyPath: 'publishedYear' },
      // multiEntry allows searching within arrays
      { name: 'by_genre', keyPath: 'genres', options: { multiEntry: true } }
    ]
  },
  // ... you can define more stores here
];

// 3. Initialize the database
// Choose a database name and version. Increment the version when changing the schema.
const db = new FastIndexedDB('MyLibraryDB', 1, librarySchema);

// 4. Use the database (async operations)
async function manageLibrary() {
  try {
    console.log('Adding books...');
    // Use put to add or update records
    await db.put<Book>('books', { isbn: '978-1234567890', title: 'The Great Novel', author: 'Jane Doe', publishedYear: 2021, genres: ['fiction', 'drama'] });
    await db.put<Book>('books', { isbn: '978-0987654321', title: 'Learning TypeScript', author: 'John Smith', publishedYear: 2022, genres: ['tech', 'programming'] });
    await db.put<Book>('books', { isbn: '978-1122334455', title: 'Another Novel', author: 'Jane Doe', publishedYear: 2023, genres: ['fiction', 'mystery'] });

    console.log('Retrieving a book by ISBN...');
    const book = await db.get<Book>('books', '978-1234567890');
    console.log('Found book:', book);

    console.log('Finding books by Jane Doe...');
    const janeDoeBooks = await db.findByIndex<Book>('books', 'by_author', 'Jane Doe');
    console.log('Jane Doe\'s books:', janeDoeBooks);

    console.log('Finding fiction books...');
    // multiEntry index allows searching the 'genres' array
    const fictionBooks = await db.findByIndex<Book>('books', 'by_genre', 'fiction');
    console.log('Fiction books:', fictionBooks);

    console.log('Finding books published after 2021 (using range query)...');
    const range = IDBKeyRange.lowerBound(2022); // >= 2022
    const recentBooks = await db.findByIndexRange<Book>('books', 'by_year', { query: range });
    console.log('Recent books:', recentBooks);

    console.log('Counting tech books...');
    const techBookCount = await db.countByIndex('books', 'by_genre', 'tech');
    console.log(`There are ${techBookCount} tech books.`);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // 5. Close the connection when done (optional, but good practice)
    console.log('Closing database connection.');
    db.close();
  }
}

manageLibrary();

## Running the Web Example

A simple web-based example can be found in the `/examples/web` directory.
To run it:

1.  **Install dependencies:** If you haven't already, install the project dependencies.
    ```bash
    npm install
    ```
2.  **Start the example server:** This command will build the library and start a local web server.
    ```bash
    npm run start:example
    ```
    This uses the `http-server` package (added as a dev dependency) to serve the project root directory and automatically opens the example page (`examples/web/index.html`) in your default browser.

3.  **Interact:** Open the browser's developer console (F12) to see logs and use the buttons on the page to trigger database operations.

## API Documentation

Detailed API documentation, generated from the source code comments, is available here:

➡️ **[View Generated API Docs](./docs/index.html)**

(You might need to run `npm run docs` first to generate them locally)

Key interfaces and the main class:

*   `StoreSchema`: Defines the structure of an object store, including its name, key path, and indexes.
*   `IndexSchema`: Defines an index within an object store.
*   `FastIndexedDB`: The main class to interact with the database.
    *   `constructor(dbName, version, schema)`: Initializes the database.
    *   `add(storeName, data)`: Adds a record (fails if key exists).
    *   `put(storeName, data)`: Adds or updates a record.
    *   `get(storeName, key)`: Retrieves a single record by key.
    *   `getAll(storeName)`: Retrieves all records from a store.
    *   `delete(storeName, key)`: Deletes a record by key.
    *   `clear(storeName)`: Deletes all records in a store.
    *   `findByIndex(storeName, indexName, query)`: Finds records by exact index match.
    *   `findByIndexRange(storeName, indexName, options)`: Finds records using an index range, with options for direction, limit, and offset.
    *   `countByIndex(storeName, indexName, query?)`: Counts records matching an index query.
    *   `close()`: Closes the database connection.

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Add tests for your changes.
5.  Ensure all tests pass (`npm test`).
6.  Generate documentation if you changed APIs (`npm run docs`).
7.  Commit your changes (`git commit -am 'Add some feature'`).
8.  Push to the branch (`git push origin feature/your-feature-name`).
9.  Open a Pull Request.

Please ensure your code adheres to the existing style and that all tests pass in the CI environment.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details. 