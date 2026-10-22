import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
    BindingConsentPreflightValidator,
    EducationOsConsentGrantValidator,
    type BindingConsentPreflight,
    type EducationOsConsentGrant,
} from '@learncard/types';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const canonicalJson = (value: JsonValue): string => {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
    if (value !== null && typeof value === 'object') {
        return `{${Object.keys(value)
            .sort()
            .map(key => `${JSON.stringify(key)}:${canonicalJson(value[key]!)}`)
            .join(',')}}`;
    }
    return JSON.stringify(value);
};

/** Sorted JSON object keys, preserved array order, UTF-8 SHA-256. */
export const hashConsentEvidence = (value: unknown): string => {
    const json: JsonValue = z.json().parse(JSON.parse(JSON.stringify(value)));
    return createHash('sha256').update(canonicalJson(json)).digest('hex');
};

export const hashEducationOsGrant = (grant: EducationOsConsentGrant): string =>
    hashConsentEvidence(EducationOsConsentGrantValidator.parse(grant));

export const hashBindingConsentPreflight = (
    snapshot: Omit<BindingConsentPreflight, 'hash'>
): string => {
    const { hash: _hash, ...body } = BindingConsentPreflightValidator.parse({
        ...snapshot,
        hash: '0'.repeat(64),
    });
    return hashConsentEvidence(body);
};
