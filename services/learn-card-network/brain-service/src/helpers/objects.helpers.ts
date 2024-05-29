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
 * Flattens a deeply nested object into an object with dot-separated keys.
 * @param obj The object to flatten.
 * @returns The flattened object.
 */
export function flattenObject<T extends Record<string, any>>(obj: T): FlattenObject<T> {
    const result: Record<string, any> = {};

    function flattenHelper(currentObj: any, prefix = '') {
        for (const key in currentObj) {
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (
                typeof currentObj[key] === 'object' &&
                currentObj[key] !== null &&
                !Array.isArray(currentObj[key])
            ) {
                flattenHelper(currentObj[key], newKey);
            } else {
                result[newKey] = currentObj[key];
            }
        }
    }

    flattenHelper(obj);

    return result as FlattenObject<T>;
}

/**
 * "Inflates" a flattened object back into a deeply nested structure.
 * @param obj The flattened object.
 * @returns The nested object.
 */
export function inflateObject<T extends Record<string, any>>(obj: FlattenObject<T>): T {
    const result: Record<string, any> = {};

    for (const key in obj) {
        const keys = key.split('.');
        let current = result;

        while (keys.length > 1) {
            const subKey = keys.shift()!;
            if (!current[subKey]) {
                current[subKey] = {};
            }
            current = current[subKey] as Record<string, any>;
        }

        current[keys[0]!] = obj[key as keyof typeof obj];
    }

    return result as T;
}

type FlattenObjectKeys<T extends Record<string, unknown>, Key = keyof T> = Key extends string
    ? T[Key] extends Record<string, unknown>
    ? `${Key}.${FlattenObjectKeys<T[Key]>}`
    : `${Key}`
    : never;

type IsTuple<T> = T extends Array<any>
    ? T['length'] extends number
    ? number extends T['length']
    ? false
    : true
    : true
    : false;

type IsEmptyTuple<T extends Array<any>> = T['length'] extends 0 ? true : false;

/**
 * If Cache is empty return Prop without dot,
 * to avoid ".user"
 */
type HandleDot<Cache extends string, Prop extends string | number> = Cache extends ''
    ? `${Prop}`
    : `${Cache}.${Prop}`;

/**
 * Simple iteration through object properties
 */
type HandleObject<Obj, Cache extends string> = {
    [Prop in keyof Obj]:  // concat previous Cacha and Prop
    | HandleDot<Cache, Prop & string>
    // with next Cache and Prop
    | Path<Obj[Prop], HandleDot<Cache, Prop & string>>;
}[keyof Obj];

type Path<Obj, Cache extends string = ''> = Obj extends PropertyKey
    ? // return Cache
    Cache
    : // if Obj is Array (can be array, tuple, empty tuple)
    Obj extends Array<unknown>
    ? // and is tuple
    IsTuple<Obj> extends true
    ? // and tuple is empty
    IsEmptyTuple<Obj> extends true
    ? // call recursively Path with `-1` as an allowed index
    Path<PropertyKey, HandleDot<Cache, -1>>
    : // if tuple is not empty we can handle it as regular object
    HandleObject<Obj, Cache>
    : // if Obj is regular  array call Path with union of all elements
    Path<Obj[number], HandleDot<Cache, number>>
    : // if Obj is neither Array nor Tuple nor Primitive - treat is as object
    HandleObject<Obj, Cache>;

type Acc = Record<string, any>;

type ReducerCallback<Accumulator extends Acc, El extends string> = El extends keyof Accumulator
    ? Accumulator[El]
    : El extends '-1'
    ? never
    : Accumulator;

type Reducer<Keys extends string, Accumulator extends Acc = {}> =
    // Key destructure
    Keys extends `${infer Prop}.${infer Rest}`
    ? // call Reducer with callback, just like in JS
    Reducer<Rest, ReducerCallback<Accumulator, Prop>>
    : // this is the last part of path because no dot
    Keys extends `${infer Last}`
    ? // call reducer with last part
    ReducerCallback<Accumulator, Last>
    : never;

export type FlattenObject<T extends Record<string, any>> = {
    [Prop in FlattenObjectKeys<T>]: Reducer<Prop, T>;
};
