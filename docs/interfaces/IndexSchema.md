[**IndexedDB Fast Search v0.1.1**](../README.md)

***

[IndexedDB Fast Search](../globals.md) / IndexSchema

# Interface: IndexSchema

Defines the structure for an index within an IndexedDB Object Store.

## Properties

### keyPath

> **keyPath**: `string` \| `string`[]

The key path for the index. See `IDBObjectStore.createIndex`.

***

### name

> **name**: `string`

The name of the index.

***

### options?

> `optional` **options**: `IDBIndexParameters`

Options for the index (e.g., unique, multiEntry). See `IDBIndexParameters`.
