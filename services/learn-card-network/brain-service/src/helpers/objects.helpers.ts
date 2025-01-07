/**
 * Flattens a deeply nested object into an object with dot-separated keys, handling arrays.
 * @param obj The object to flatten.
 * @returns The flattened object.
 */
export function flattenObject<T>(obj: T): FlattenObject<T> {
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
export function inflateObject<T>(obj: FlattenObject<T>): T {
    let result: any = {};

    for (const key in obj) {
        const keys = key.split('.');
        let current = result;

        for (let i = 0; i < keys.length; i++) {
            const subKey = keys[i]!;
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

    return result as T;
}

function getParent(obj: any, keys: string[]): any {
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]!;
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
 * Helper type to combine key prefixes.
 */
type AddPrefix<Prefix extends string, Key extends string | number | symbol> = Prefix extends ''
    ? `${Key & string}`
    : `${Prefix}.${Key & string}`;

/**
 * Type definition for FlattenObject<T> that recursively flattens an object type into dot-separated keys.
 */
export type FlattenObject<T> = _Flatten<T> extends infer O ? { [K in keyof O]: O[K] } : never;

type _Flatten<T, Prefix extends string = ''> = T extends Array<unknown>
    ? {
        [K in keyof T]: _Flatten<T[K], AddPrefix<Prefix, K & string>>;
    }[number]
    : T extends object
    ? {
        [K in keyof T]: _Flatten<T[K], AddPrefix<Prefix, K & string>>;
    }[keyof T]
    : {
        [P in Prefix]: T;
    };
