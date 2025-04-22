[**IndexedDB Fast Search v0.1.1**](../README.md)

***

[IndexedDB Fast Search](../globals.md) / FastIndexedDB

# Class: FastIndexedDB

## Constructors

### Constructor

> **new FastIndexedDB**(`dbName`, `version`, `schema`): `FastIndexedDB`

#### Parameters

##### dbName

`string`

##### version

`number`

##### schema

[`StoreSchema`](../interfaces/StoreSchema.md)[]

#### Returns

`FastIndexedDB`

## Methods

### add()

> **add**\<`T`\>(`storeName`, `data`): `Promise`\<`IDBValidKey`\>

Add a new record to the store

#### Type Parameters

##### T

`T`

#### Parameters

##### storeName

`string`

Name of the store

##### data

`T`

The data to store

#### Returns

`Promise`\<`IDBValidKey`\>

***

### clear()

> **clear**(`storeName`): `Promise`\<`void`\>

Clear all records from a store

#### Parameters

##### storeName

`string`

Name of the store to clear

#### Returns

`Promise`\<`void`\>

***

### close()

> **close**(): `void`

Close the database connection

#### Returns

`void`

***

### count()

> **count**(`storeName`): `Promise`\<`number`\>

Count the number of records in a store

#### Parameters

##### storeName

`string`

Name of the store to count

#### Returns

`Promise`\<`number`\>

***

### countByIndex()

> **countByIndex**(`storeName`, `indexName`, `query?`): `Promise`\<`number`\>

Count records by index

#### Parameters

##### storeName

`string`

Name of the store

##### indexName

`string`

Name of the index

##### query?

`IDBKeyRange`

Optional query to filter by

#### Returns

`Promise`\<`number`\>

***

### delete()

> **delete**(`storeName`, `key`): `Promise`\<`void`\>

Delete a record by its key

#### Parameters

##### storeName

`string`

Name of the store

##### key

`IDBValidKey`

The key to delete

#### Returns

`Promise`\<`void`\>

***

### findByIndex()

> **findByIndex**\<`T`\>(`storeName`, `indexName`, `query`): `Promise`\<`T`[]\>

Find records by index

#### Type Parameters

##### T

`T`

#### Parameters

##### storeName

`string`

Name of the store

##### indexName

`string`

Name of the index

##### query

`IDBValidKey`

The value to search for

#### Returns

`Promise`\<`T`[]\>

***

### findByIndexRange()

> **findByIndexRange**\<`T`\>(`storeName`, `indexName`, `options`): `Promise`\<`T`[]\>

Find records by index range

#### Type Parameters

##### T

`T`

#### Parameters

##### storeName

`string`

Name of the store

##### indexName

`string`

Name of the index

##### options

Query options including range and pagination

###### direction?

`IDBCursorDirection`

###### limit?

`number`

###### offset?

`number`

###### query?

`IDBKeyRange`

#### Returns

`Promise`\<`T`[]\>

***

### get()

> **get**\<`T`\>(`storeName`, `key`): `Promise`\<`undefined` \| `T`\>

Get a record by its key

#### Type Parameters

##### T

`T`

#### Parameters

##### storeName

`string`

Name of the store

##### key

`IDBValidKey`

The key to look up

#### Returns

`Promise`\<`undefined` \| `T`\>

***

### getAll()

> **getAll**\<`T`\>(`storeName`): `Promise`\<`T`[]\>

Get all records from a store

#### Type Parameters

##### T

`T`

#### Parameters

##### storeName

`string`

Name of the store

#### Returns

`Promise`\<`T`[]\>

***

### put()

> **put**\<`T`\>(`storeName`, `data`): `Promise`\<`IDBValidKey`\>

Add or update a record in the store

#### Type Parameters

##### T

`T`

#### Parameters

##### storeName

`string`

Name of the store

##### data

`T`

The data to store

#### Returns

`Promise`\<`IDBValidKey`\>

***

### table()

> **table**\<`T`\>(`storeName`): `QueryBuilder`\<`T`\>

Get a query builder for the specified store

#### Type Parameters

##### T

`T`

#### Parameters

##### storeName

`string`

Name of the store to query

#### Returns

`QueryBuilder`\<`T`\>
