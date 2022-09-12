/** Type guard for removing null/undefined */
export const isNotNull = <T>(item?: T | null): item is T => !!item;

/** Removes null/undefined from items in an array */
export const filterNulls = <T>(array: (T | null | undefined)[]) => array.filter(isNotNull);
