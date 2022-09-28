export type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

export type Last<T extends any[]> = T extends [...any[], infer R] ? R : never;

export type RemoveLast<T extends any[]> = T extends [...infer R, any] ? R : [];

export type RemoveFirstArg<T extends (...args: any[]) => any> = (
    args: Tail<Parameters<T>>
) => ReturnType<T>;

/** @group Utility Types */
export type MergeObjects<Objects extends Record<string, any>[]> = undefined extends Objects[2]
    ? Omit<Objects[0], keyof Objects[1]> & Objects[1]
    : Omit<MergeObjects<RemoveLast<Objects>>, keyof Last<Objects>> & Last<Objects>;
