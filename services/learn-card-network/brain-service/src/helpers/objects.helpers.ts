// WARNING: Here be dragons
// To deal with Neo4j's weirdness about nested objects, if we want to query objects with
// deeply nested fields, we need to flatten them.
//
// It turns out that it's _really_ hard to get TypeScript to understand this, but really hard does
// not mean impossible, so this file contains types and utility functions to both flatten and
// inflate objects!
//
// Be warned though, these types are completely ridiculous!

/**
 * Flattens a deeply nested object into an object with dot-separated keys, handling arrays.
 * @param obj The object to flatten.
 * @returns The flattened object.
 */
export function flattenObject<T extends any>(obj: T): FlattenObject<T> {
    const result: Record<string, any> = {};

    function flattenHelper(currentObj: any, prefix = '') {
        if (Array.isArray(currentObj)) {
            currentObj.forEach((item, index) => {
                const arrayKey = prefix ? `${prefix}.${index}` : `${index}`;
                if (item !== null && typeof item === 'object') {
                    flattenHelper(item, arrayKey);
                } else {
                    result[arrayKey] = item;
                }
            });
        } else if (currentObj !== null && typeof currentObj === 'object') {
            for (const key in currentObj) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                flattenHelper(currentObj[key], newKey);
            }
        } else {
            if (prefix !== '') {
                result[prefix] = currentObj;
            }
        }
    }

    flattenHelper(obj);

    return result as FlattenObject<T>;
}

/**
 * "Inflates" a flattened object back into a deeply nested structure, handling arrays.
 * @param obj The flattened object.
 * @returns The nested object.
 */
export function inflateObject<T extends Record<string, any>>(obj: FlattenObject<T>): T {
    let result: any = {};

    for (const key in obj) {
        const keys = key.split('.');
        let current = result;

        for (let i = 0; i < keys.length; i++) {
            const subKey = keys[i];
            const isLast = i === keys.length - 1;

            const index = Number(subKey);
            if (!isNaN(index) && Number.isInteger(index)) {
                // subKey is an array index
                if (!Array.isArray(current)) {
                    current = [];
                    // Assign to parent
                    const parent = getParent(result, keys.slice(0, i));
                    if (parent != null) {
                        parent[keys[i - 1]!] = current;
                    } else {
                        // At the root
                        result = current;
                    }
                }
                if (isLast) {
                    current[index] = obj[key];
                } else {
                    if (current[index] == null) {
                        current[index] = {};
                    }
                    current = current[index];
                }
            } else {
                // subKey is an object key
                if (Array.isArray(current)) {
                    // Cannot have object key in an array
                    throw new Error(`Invalid structure at key ${key}`);
                }
                if (!(subKey in current)) {
                    current[subKey] = {};
                }
                if (isLast) {
                    current[subKey] = obj[key];
                } else {
                    current = current[subKey];
                }
            }
        }
    }

    return result;
}

function getParent(obj: any, keys: string[]): any {
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const index = Number(key);
        if (!isNaN(index) && Number.isInteger(index)) {
            current = current[index];
        } else {
            current = current[key];
        }
    }
    return current;
}

/**
 * Type definition for FlattenObject that handles arrays and objects recursively.
 * Due to TypeScript limitations, this may not capture all scenarios perfectly.
 */
export type FlattenObject<T> = T extends Array<infer U>
    ? FlattenArray<U>
    : T extends object
    ? FlattenObjectHelper<T>
    : T;

type FlattenObjectHelper<T, Prefix extends string = ''> = {
    [K in keyof T]: T[K] extends Array<infer U>
    ? FlattenArray<U, `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`>
    : T[K] extends object
    ? FlattenObjectHelper<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`>
    : { [P in `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`]: T[K] };
}[keyof T];

type FlattenArray<T, Prefix extends string = ''> = T extends object
    ? {
        [Index in number]: FlattenObjectHelper<T, `${Prefix}.${Index & string}`>;
    }[number]
    : { [P in `${Prefix}.${number}`]: T };
