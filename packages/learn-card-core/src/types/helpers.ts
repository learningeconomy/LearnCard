export type OmitNevers<T extends Record<string, any>> = Omit<
    T,
    { [Index in keyof T]: [T[Index]] extends [never] ? Index : never }[keyof T]
>;
