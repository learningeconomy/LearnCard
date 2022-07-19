import type { TileDocument } from '@ceramicnetwork/stream-tile';
export declare type TileContent = Record<string, any> | null | undefined;
export declare type TileDoc = TileDocument<TileContent>;
export declare type MutationFunc = (current: TileDoc) => Promise<TileDoc>;
export declare class TileProxy {
    #private;
    constructor(getRemote: () => Promise<TileDoc>);
    /** @internal */
    _createValuePromise(): void;
    change(mutation: MutationFunc): Promise<void>;
    changeContent(change: (content: TileContent) => TileContent): Promise<void>;
    get(): Promise<TileDoc>;
    /** @internal */
    _start(): Promise<void>;
    /** @internal */
    _next(value: TileDoc): void;
    /** @internal */
    _end(value: TileDoc): void;
}
