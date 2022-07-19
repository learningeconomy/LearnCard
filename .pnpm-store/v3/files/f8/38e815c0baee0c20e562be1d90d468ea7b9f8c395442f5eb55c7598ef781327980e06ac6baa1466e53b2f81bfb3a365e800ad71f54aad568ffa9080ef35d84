interface MemoizeArgs {
    expiring?: number;
    hashFunction?: boolean | ((...args: any[]) => any);
    tags?: string[];
}
export declare function Memoize(args?: MemoizeArgs | MemoizeArgs['hashFunction']): (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => void;
export declare function MemoizeExpiring(expiring: number, hashFunction?: MemoizeArgs['hashFunction']): (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => void;
export declare function clear(tags: string[]): number;
export {};
