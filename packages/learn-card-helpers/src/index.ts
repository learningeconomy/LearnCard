import { JWE, JWEValidator } from '@learncard/types';

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
