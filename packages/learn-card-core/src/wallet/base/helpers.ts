import { Plugin } from 'types/wallet';
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

    return false;
};
