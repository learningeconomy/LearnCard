import { PERSONAL_FIELDS, WALLET_CATEGORIES } from './constants';
import { canonicalJsonString } from './canonical';
import type {
    ConsentRequest,
    NormalizedConsentScopes,
    PersonalField,
    WalletCategory,
} from './types';
import { getDidYouMean, sortUnique, validatePersonalField, validateWalletCategory } from './utils';

const normalizeCategoryArray = (values: unknown, path: string): WalletCategory[] => {
    if (values === undefined) {
        return [];
    }

    if (!Array.isArray(values)) {
        throw new Error(`${path} must be an array`);
    }

    const normalized = values.map((value, index) => {
        if (!validateWalletCategory(value)) {
            const suggestion =
                typeof value === 'string' ? getDidYouMean(value, WALLET_CATEGORIES) : undefined;
            const suffix = suggestion ? `; did you mean "${suggestion}"?` : '';
            throw new Error(
                `${path}[${index}] has unknown wallet category "${String(value)}"${suffix}`
            );
        }

        return value;
    });

    return sortUnique(normalized);
};

const normalizePersonalFieldArray = (values: unknown, path: string): PersonalField[] => {
    if (values === undefined) {
        return [];
    }

    if (!Array.isArray(values)) {
        throw new Error(`${path} must be an array`);
    }

    const normalized = values.map((value, index) => {
        if (!validatePersonalField(value)) {
            const suggestion =
                typeof value === 'string' ? getDidYouMean(value, PERSONAL_FIELDS) : undefined;
            const suffix = suggestion ? `; did you mean "${suggestion}"?` : '';
            throw new Error(
                `${path}[${index}] has unknown personal field "${String(value)}"${suffix}`
            );
        }

        return value;
    });

    return sortUnique(normalized);
};

/**
 * Validates, sorts, deduplicates, and normalizes a consent request into canonical scope buckets.
 */
export const normalizeConsentRequest = (req: ConsentRequest): NormalizedConsentScopes => {
    return {
        read: {
            credentialCategories: normalizeCategoryArray(
                req.read?.credentialCategories,
                'consent.read.credentialCategories'
            ),
            personalFields: normalizePersonalFieldArray(
                req.read?.personalFields,
                'consent.read.personalFields'
            ),
        },
        write: {
            credentialCategories: normalizeCategoryArray(
                req.write?.credentialCategories,
                'consent.write.credentialCategories'
            ),
        },
    };
};

/**
 * Returns a deterministic JSON string for normalized consent scopes.
 */
export const canonicalConsentScopeString = (scopes: NormalizedConsentScopes): string => {
    return canonicalJsonString(scopes);
};
