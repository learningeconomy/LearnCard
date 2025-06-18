import { JWEValidator, type JWE } from '@learncard/types';
import type { DataTransformer } from '@trpc/server';

/**
 * Determines whether or not a string is a valid hexadecimal string
 *
 * E.g. 'abc123' is valid hex, 'zzz' is not
 */
export const isHex = (str: string) => /^[0-9a-f]+$/i.test(str);

/** Determines whether or not an object is an encrypted JWE */
export const isEncrypted = (item: Record<string, any>): item is JWE => {
    return JWEValidator.safeParse(item).success;
};

/**
 * tRPC data transformer that handles RegExp serialization/deserialization
 */
export const RegExpTransformer: DataTransformer = {
    serialize(object: any): any {
        return JSON.stringify(object, (_key, value) => {
            if (value instanceof RegExp) return value.toString(); // Converts to format /pattern/flags

            return value;
        });
    },

    deserialize(object: any): any {
        // Old clients will for some reason already be deserialized, so this checks for that to retain
        // backwards compat
        if (typeof object !== 'string') return object;

        return JSON.parse(object, (_key, value) => {
            if (typeof value === 'string') {
                const match = value.match(/^\/(.*)\/([gimsuy]*)$/);

                if (match) {
                    try {
                        return new RegExp(match[1], match[2]);
                    } catch (error) {
                        console.warn(`Failed to parse RegExp: ${error}`);
                        return value;
                    }
                }
            }
            return value;
        });
    },
};
