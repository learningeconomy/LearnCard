export type DeepPartial<T> = T extends object
    ? {
        [P in keyof T]?: DeepPartial<T[P]>;
    }
    : T;

export interface Nothing { }
export type Other<T> = T & Nothing;

export type SuggestString<Literals extends string> = Literals | Other<string>;
