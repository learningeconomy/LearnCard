export type Tail<T extends any[]> = T extends [infer _, ...infer R] ? R : never;

export type RemoveFirstArg<T extends (...args: any[]) => any> = (
    args: Tail<Parameters<T>>
) => ReturnType<T>;
