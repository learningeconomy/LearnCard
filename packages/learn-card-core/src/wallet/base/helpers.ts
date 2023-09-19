import { LearnCard, Plugin } from 'types/wallet';
import { ControlPlane } from 'types/planes';

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

export const pluginImplementsPlane = <Plane extends ControlPlane>(
    plugin: Plugin,
    plane: Plane
): plugin is Plugin<any, Plane> => {
    if (plane === 'read') return 'get' in (plugin.read ?? {});
    if (plane === 'store') return 'upload' in (plugin.store ?? {});
    if (plane === 'index') return 'get' in (plugin.index ?? {});
    if (plane === 'cache') return 'getIndex' in (plugin.cache ?? {});
    if (plane === 'id') return 'did' in (plugin.id ?? {});
    if (plane === 'context') return 'resolveStaticDocument' in (plugin.context ?? {});

    return false;
};

export const learnCardImplementsPlane = <Plane extends ControlPlane>(
    learnCard: LearnCard<any, any, any>,
    plane: Plane
): learnCard is LearnCard<any, Plane> => {
    if (plane === 'read') return 'read' in learnCard;
    if (plane === 'store') return 'store' in learnCard;
    if (plane === 'index') return 'index' in learnCard;
    if (plane === 'cache') return 'cache' in learnCard;
    if (plane === 'id') return 'id' in learnCard;
    if (plane === 'context') return 'context' in learnCard;

    return false;
};

export const mapObject = <T extends string, U, V>(
    obj: Record<T, U>,
    callback: (value: U, index: number) => V
): Record<T, V> => {
    return Object.fromEntries(
        Object.entries<U>(obj).map(([key, value], index) => [key, callback(value, index)])
    ) as any;
};

export const isFulfilledAndNotEmpty = <T>(
    input: PromiseSettledResult<T>
): input is PromiseFulfilledResult<T> => input.status === 'fulfilled' && !!input.value;

export const uniqBy = <Obj extends Record<string, any>>(
    array: Obj[],
    key: keyof Obj | ((obj: Obj) => any)
) => {
    return [
        ...new Map(array.map(obj => [key instanceof Function ? key(obj) : obj[key], obj])).values(),
    ];
};
