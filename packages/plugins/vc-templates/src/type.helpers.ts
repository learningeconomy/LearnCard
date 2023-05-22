export type DiscriminatedUnionize<T extends object = {}, K extends string = 'type'> = {
    [Key in keyof T]: { [Key2 in K]: Key } & T[Key];
}[keyof T];
