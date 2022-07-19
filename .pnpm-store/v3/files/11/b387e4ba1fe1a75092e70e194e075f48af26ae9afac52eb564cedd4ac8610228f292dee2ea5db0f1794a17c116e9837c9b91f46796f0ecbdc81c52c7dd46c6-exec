import type { StreamID } from '@ceramicnetwork/streamid';
import type { StreamState } from './stream.js';
export interface ForwardPagination {
    readonly first: number;
    readonly after?: string;
}
export interface BackwardPagination {
    readonly last: number;
    readonly before?: string;
}
export declare type Pagination = ForwardPagination | BackwardPagination;
export interface BaseQuery {
    readonly model: StreamID | string;
    readonly account?: string;
}
export interface IndexApi {
    queryIndex(query: BaseQuery & Pagination): Promise<Page<StreamState>>;
}
export declare type Edge<T> = {
    cursor: string;
    node: T;
};
export interface Page<T> {
    readonly edges: Array<Edge<T>>;
    readonly pageInfo: PageInfo;
}
export declare type PageInfo = {
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
    readonly startCursor?: string;
    readonly endCursor?: string;
};
//# sourceMappingURL=index-api.d.ts.map