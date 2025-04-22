// Access the library through the global variable (set in rollup.config.js)
// Ensure the UMD build has been generated (`npm run build`)
const { FastIndexedDB, StoreSchema } = window.FastIndexedDB;

// --- Configuration ---
const dbName = 'WebLibraryDB';
const dbVersion = 1; // Increment if schema changes
const booksStoreName = 'books';

/** @type {StoreSchema[]} */
const librarySchema = [
    {
        name: booksStoreName,
        keyPath: 'isbn',
        indexes: [
            { name: 'by_title', keyPath: 'title' },
            { name: 'by_author', keyPath: 'author' },
            { name: 'by_year', keyPath: 'publishedYear' },
            { name: 'by_genre', keyPath: 'genres', options: { multiEntry: true } }
        ]
    }
];

// --- DOM Elements ---
const isbnInput = document.getElementById('isbn');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const yearInput = document.getElementById('year');
const genresSelect = document.getElementById('genres');
const addBookBtn = document.getElementById('addBook');
const findJaneDoeBtn = document.getElementById('findJaneDoe');
const findFictionBtn = document.getElementById('findFiction');
const clearBooksBtn = document.getElementById('clearBooks');
const runDemoBtn = document.getElementById('runDemo');
const outputEl = document.getElementById('output');
const bookListEl = document.getElementById('bookList');

// --- Database Instance ---
let dbInstance = null;

function getDbInstance() {
    if (!dbInstance) {
        logOutput('Initializing database connection...');
        try {
            dbInstance = new FastIndexedDB(dbName, dbVersion, librarySchema);
            logOutput(`Database '${dbName}' v${dbVersion} instance created.`);
        } catch (error) {
            logError('Failed to initialize FastIndexedDB', error);
            throw error;
        }
    }
    return dbInstance;
}

// --- Helper Functions ---
function logOutput(message, data = null) {
    console.log(message, data !== null ? data : '');
    const text = data ? `${message}\n${JSON.stringify(data, null, 2)}` : message;
    outputEl.textContent = text + '\n\n' + outputEl.textContent;
}

function logError(message, error) {
    console.error(message, error);
    outputEl.textContent = `ERROR: ${message}\n${error}\n\n` + outputEl.textContent;
}

function renderBookList(books) {
    bookListEl.innerHTML = '';
    books.forEach(book => {
        const bookEl = document.createElement('div');
        bookEl.className = 'book-item';
        bookEl.innerHTML = `
            <h3>${book.title}</h3>
            <p>Author: ${book.author}</p>
            <p>ISBN: ${book.isbn}</p>
            <p>Published: ${book.publishedYear}</p>
            <div class="genres">
                ${book.genres.map(genre => `<span class="genre">${genre}</span>`).join('')}
            </div>
        `;
        bookListEl.appendChild(bookEl);
    });
}

// --- Core Demo Logic ---
async function addBook() {
    try {
        const isbn = isbnInput.value.trim();
        const title = titleInput.value.trim();
        const author = authorInput.value.trim();
        const year = parseInt(yearInput.value);
        const genres = Array.from(genresSelect.selectedOptions).map(option => option.value);

        if (!isbn || !title || !author || !year || genres.length === 0) {
            logError('Please fill in all fields');
            return;
        }

        const book = {
            isbn,
            title,
            author,
            publishedYear: year,
            genres
        };

        const db = getDbInstance();
        logOutput(`Adding book: ${title}...`);
        const key = await db.put(booksStoreName, book);
        logOutput(`Book added successfully with ISBN: ${key}`, book);

        // Clear form
        isbnInput.value = '';
        titleInput.value = '';
        authorInput.value = '';
        yearInput.value = '';
        genresSelect.selectedIndex = -1;

        // Refresh book list
        const allBooks = await db.table(booksStoreName).toArray();
        renderBookList(allBooks);
    } catch (error) {
        logError('Failed to add book', error);
    }
}

async function findBooks(indexName, query) {
    try {
        const db = getDbInstance();
        logOutput(`Finding books by ${indexName} = ${JSON.stringify(query)}...`);
        const results = await db.table(booksStoreName)
            .where(indexName)
            .equals(query)
            .toArray();
        logOutput(`Found ${results.length} book(s) matching query:`, results);
        renderBookList(results);
        return results;
    } catch (error) {
        logError(`Failed to find books by ${indexName}`, error);
    }
}

async function clearStore() {
    try {
        const db = getDbInstance();
        logOutput(`Clearing store: ${booksStoreName}...`);
        await db.clear(booksStoreName);
        logOutput(`Store '${booksStoreName}' cleared successfully.`);
        bookListEl.innerHTML = '';
    } catch (error) {
        logError(`Failed to clear store ${booksStoreName}`, error);
    }
}

// Sample book data
const sampleBooks = [
    { isbn: '978-1234567890', title: 'The Great Novel', author: 'Jane Doe', publishedYear: 2021, genres: ['fiction', 'drama'] },
    { isbn: '978-0987654321', title: 'Learning TypeScript', author: 'John Smith', publishedYear: 2022, genres: ['tech', 'programming'] },
    { isbn: '978-1122334455', title: 'Another Novel', author: 'Jane Doe', publishedYear: 2023, genres: ['fiction', 'mystery'] },
];

async function runFullDemo() {
    outputEl.textContent = '';
    logOutput('--- Starting Full Demo --- ');

    // Add all sample books
    for (const book of sampleBooks) {
        const db = getDbInstance();
        await db.put(booksStoreName, book);
    }

    // Perform some find operations using the query builder
    const db = getDbInstance();
    
    // Find books by author
    logOutput('Finding books by Jane Doe...');
    const janeDoeBooks = await db.table(booksStoreName)
        .where('by_author')
        .equals('Jane Doe')
        .toArray();
    logOutput('Jane Doe\'s books:', janeDoeBooks);

    // Find tech books
    logOutput('Finding tech books...');
    const techBooks = await db.table(booksStoreName)
        .where('by_genre')
        .equals('tech')
        .toArray();
    logOutput('Tech books:', techBooks);

    // Example range query
    logOutput('Finding books published >= 2022...');
    const recentBooks = await db.table(booksStoreName)
        .where('by_year')
        .aboveOrEqual(2022)
        .toArray();
    logOutput('Recent books:', recentBooks);

    // Display all books
    const allBooks = await db.table(booksStoreName).toArray();
    renderBookList(allBooks);
    
    logOutput('--- Demo Finished --- ');
}

// --- Event Listeners ---
addBookBtn.addEventListener('click', addBook);
findJaneDoeBtn.addEventListener('click', () => findBooks('by_author', 'Jane Doe'));
findFictionBtn.addEventListener('click', () => findBooks('by_genre', 'fiction'));
clearBooksBtn.addEventListener('click', clearStore);
runDemoBtn.addEventListener('click', runFullDemo);

// Initial log
logOutput('Web example loaded. Use the form to add books or click buttons to run operations.');

// Optional: Close DB on page unload
window.addEventListener('beforeunload', () => {
    if (dbInstance) {
        logOutput('Closing DB connection on page unload...');
        dbInstance.close();
    }
}); 