/** @group Utility Types */
export type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

/** @group Utility Types */
export type Last<T extends any[]> = T extends [...any[], infer R] ? R : never;

/** @group Utility Types */
export type RemoveLast<T extends any[]> = T extends [...infer R, any] ? R : [];

/** @group Utility Types */
export type RemoveFirstArg<T extends (...args: any[]) => any> = (
    args: Tail<Parameters<T>>
) => ReturnType<T>;

/** @group Utility Types */
export type RemoveLastArg<T extends (...args: any[]) => any> = (
    args: RemoveLast<Parameters<T>>
) => ReturnType<T>;

/** @group Utility Types */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
    k: infer I
) => void
    ? I
    : never;

/** @group Utility Types */
export type MergeObjects<Objects extends Record<string, any>[]> = undefined extends Objects[2]
    ? Omit<Objects[0], keyof Objects[1]> & Objects[1]
    : Omit<MergeObjects<RemoveLast<Objects>>, keyof Last<Objects>> & Last<Objects>;

/** @group Utility Types */
export type DeepPartial<T> = T extends object
    ? {
        [P in keyof T]?: DeepPartial<T[P]>;
    }
    : T;

export type IsAnyOrNever<T> = [T] extends [1 & T] ? true : false;
