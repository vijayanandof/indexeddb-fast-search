import { FastIndexedDB } from './index';
export interface QueryOptions {
    limit?: number;
    offset?: number;
    direction?: 'next' | 'prev' | 'nextunique' | 'prevunique';
}
export declare class QueryBuilder<T> {
    private db;
    private storeName;
    private indexName?;
    private query?;
    private options;
    constructor(db: FastIndexedDB, storeName: string);
    where(indexName: string): this;
    equals(value: any): this;
    above(value: any): this;
    aboveOrEqual(value: any): this;
    below(value: any): this;
    belowOrEqual(value: any): this;
    between(lower: any, upper: any, includeLower?: boolean, includeUpper?: boolean): this;
    limit(count: number): this;
    offset(count: number): this;
    reverse(): this;
    toArray(): Promise<T[]>;
    count(): Promise<number>;
    first(): Promise<T | undefined>;
    last(): Promise<T | undefined>;
}
//# sourceMappingURL=query-builder.d.ts.map