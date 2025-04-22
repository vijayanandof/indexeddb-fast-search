import { FastIndexedDB } from './index';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  direction?: 'next' | 'prev' | 'nextunique' | 'prevunique';
}

export class QueryBuilder<T> {
  private db: FastIndexedDB;
  private storeName: string;
  private indexName?: string;
  private query?: any;
  private options: QueryOptions = {};

  constructor(db: FastIndexedDB, storeName: string) {
    this.db = db;
    this.storeName = storeName;
  }

  where(indexName: string): this {
    this.indexName = indexName;
    return this;
  }

  equals(value: any): this {
    this.query = value;
    return this;
  }

  above(value: any): this {
    this.query = IDBKeyRange.lowerBound(value, true);
    return this;
  }

  aboveOrEqual(value: any): this {
    this.query = IDBKeyRange.lowerBound(value);
    return this;
  }

  below(value: any): this {
    this.query = IDBKeyRange.upperBound(value, true);
    return this;
  }

  belowOrEqual(value: any): this {
    this.query = IDBKeyRange.upperBound(value);
    return this;
  }

  between(lower: any, upper: any, includeLower = true, includeUpper = true): this {
    this.query = IDBKeyRange.bound(lower, upper, !includeLower, !includeUpper);
    return this;
  }

  limit(count: number): this {
    this.options.limit = count;
    return this;
  }

  offset(count: number): this {
    this.options.offset = count;
    return this;
  }

  reverse(): this {
    this.options.direction = 'prev';
    return this;
  }

  async toArray(): Promise<T[]> {
    if (this.indexName) {
      return this.db.findByIndexRange<T>(this.storeName, this.indexName, {
        query: this.query,
        ...this.options
      });
    }
    return this.db.getAll<T>(this.storeName);
  }

  async count(): Promise<number> {
    if (this.indexName && this.query) {
      return this.db.countByIndex(this.storeName, this.indexName, this.query);
    }
    return this.db.count(this.storeName);
  }

  async first(): Promise<T | undefined> {
    const results = await this.limit(1).toArray();
    return results[0];
  }

  async last(): Promise<T | undefined> {
    const results = await this.reverse().limit(1).toArray();
    return results[0];
  }
} 