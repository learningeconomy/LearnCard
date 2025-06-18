/**
 * Flattens a deeply nested object into an object with dot-separated keys, handling arrays.
 * @param obj The object to flatten.
 * @returns The flattened object.
 */
export function flattenObject<T extends Record<string, any>>(obj: T): FlattenObject<T> {
    const result: Record<string, any> = {};

    function flattenHelper(currentObj: any, prefix = '') {
        if (Array.isArray(currentObj)) {
            if (currentObj.length === 0) result[prefix] = currentObj;
            else {
                currentObj.forEach((item, index) => {
                    const arrayKey = prefix ? `${prefix}.${index}` : `${index}`;
                    if (item !== null && typeof item === 'object') {
                        flattenHelper(item, arrayKey);
                    } else {
                        result[arrayKey] = item;
                    }
                });
            }
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
export function inflateObject<T extends Record<string, any>>(
    obj: T
): any extends T ? any : InflateObject<T> {
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
                    // If current[subKey] already exists as an array, and the new value is an empty array,
                    // then don’t overwrite it.
                    if (
                        Array.isArray(current[subKey]) &&
                        Array.isArray(obj[key]) &&
                        obj[key].length === 0
                    ) {
                        // leave the existing array intact
                    } else {
                        current[subKey] = obj[key];
                    }
                } else {
                    current = current[subKey];
                }
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const collapsedResult = collapseSparseArrays(result);
    return collapsedResult as InflateObject<T>;
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
 * Recursively collapses sparse arrays by removing `undefined` holes and
 * re-indexes their elements sequentially. Traverses the entire structure so
 * nested arrays are also compacted.
 */
function collapseSparseArrays(value: any): any {
    if (Array.isArray(value)) {
        // Remove holes / undefined entries and recursively collapse nested values
        return value.filter(v => v !== undefined).map(v => collapseSparseArrays(v));
    }

    if (value && typeof value === 'object') {
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                value[key] = collapseSparseArrays(value[key]);
            }
        }
    }

    return value;
}

type Primitive = string | number | boolean;

export type FlattenObject<T, K extends string = ''> = T extends Primitive
    ? K extends ''
    ? {}
    : undefined extends T
    ? { [P in K]?: T }
    : { [P in K]: T }
    : T extends any[]
    ? number extends T['length']
    ? FlattenObject<{
        [I in T[number]as `${K}${K extends '' ? '' : '.'}${number}`]: T[number];
    }>
    : MergeObjects<
        UnionToIntersection<
            {
                [I in keyof T]: FlattenObject<
                    T[I],
                    `${K}${K extends '' ? '' : '.'}${I & string}`
                >;
            }[number]
        >
    >
    : T extends Record<string, any>
    ? UnionToIntersection<
        MergeObjects<
            {
                [P in keyof T & string]: FlattenObject<
                    T[P],
                    `${K}${K extends '' ? '' : '.'}${P}`
                >;
            }[keyof T & string]
        >
    >
    : {};

// Rest of the types remain the same...
type UnflattenPath<K extends string, V> = K extends `${infer First}.${infer Rest}`
    ? { [P in First]: UnflattenPath<Rest, V> }
    : { [P in K]: V };

type MergeObjects<T> = {
    [K in keyof T]: T[K] extends object
    ? MergeObjects<T[K]>
    : T[K] extends string
    ? string
    : T[K] extends number
    ? number
    : T[K] extends boolean
    ? boolean
    : T[K];
};

export type InflateObject<T extends Record<string, any>> = MergeObjects<
    UnionToIntersection<
        {
            [K in keyof T]: UnflattenPath<K & string, T[K]>;
        }[keyof T]
    >
>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never;
