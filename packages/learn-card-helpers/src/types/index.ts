export const isNotMaybe = <T>(value?: T | null | undefined): value is T =>
    value !== undefined && value !== null;

export const filterMaybes = <T>(array?: (T | null | undefined)[]): T[] =>
    array?.filter(isNotMaybe) ?? [];
