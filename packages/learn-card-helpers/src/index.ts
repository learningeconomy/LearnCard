import { JWE, JWEValidator, UnsignedVC, VC } from '@learncard/types';
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

/**
 * Determines if a credential uses VC 2.0 format by checking the @context array
 */
export const isVC2Format = (credential: UnsignedVC | VC): boolean => {
    if (!credential['@context'] || !Array.isArray(credential['@context'])) {
        return false;
    }

    return credential['@context'].includes('https://www.w3.org/ns/credentials/v2');
};

/** Unwraps a boost credential from a CertifiedBoostCredential, if it is one */
export const unwrapBoostCredential = (vc?: VC | UnsignedVC) => {
    if (vc?.type?.includes('CertifiedBoostCredential') && vc?.boostCredential) {
        return vc.boostCredential;
    } else {
        return vc;
    }
};

// Export helpers from shared-helpers migration
export * from './images';
export * from './arrays';
export * from './types';
export * from './strings';
export * from './numbers';
export * from './state';

// Export utilities from shared-types migration
export * from './Utilities';

/**
 * Checks if a DID is an app-specific did:web
 *
 * App did:webs follow the pattern: did:web:learncard.app:app:<slug>
 *
 * @param did - The DID to check
 * @returns true if the DID is an app did:web, false otherwise
 */
export const isAppDidWeb = (did?: string): boolean => {
    if (!did) return false;
    // Matches did:web:<slug>:app:<slug> pattern
    const LCN_APP_DID_WEB_REGEX = /^did:web:.*:app:([^:]+)$/;
    return LCN_APP_DID_WEB_REGEX.test(did);
};
