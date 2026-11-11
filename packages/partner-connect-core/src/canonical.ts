import { normalizeForJson } from './utils';

/**
 * Serializes JSON deterministically by sorting object keys recursively.
 * Arrays preserve their original order.
 */
export const canonicalJsonString = (value: unknown): string => {
    return JSON.stringify(normalizeForJson(value));
};
