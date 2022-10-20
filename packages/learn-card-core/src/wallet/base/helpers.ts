/** Type guard for removing null/undefined */
export const isNotNull = <T>(item?: T | null): item is T => !!item;

/** Removes null/undefined from items in an array */
export const filterNulls = <T>(array: (T | null | undefined)[]) => array.filter(isNotNull);

/**
 * Loops through an array, running a callback over it until that callback returns a value. Once the
 * first value is found, it is returned. If no value is found, undefined is returned instead
 */
export const findFirstResult = <T, U>(
    array: T[],
    callback: (item: T) => U | undefined
): U | undefined => {
    return array.reduce<U | undefined>((result, item) => {
        if (result !== undefined) return result;

        return callback(item);
    }, undefined);
};
