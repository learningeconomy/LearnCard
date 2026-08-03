import type { BitstringStatusListEntry, BitstringStatusPurpose } from '@learncard/types';

export const getCredentialStatusArray = (credential: unknown): Record<string, unknown>[] => {
    if (!credential || typeof credential !== 'object' || Array.isArray(credential)) return [];

    const status = (credential as { credentialStatus?: unknown }).credentialStatus;
    if (!status) return [];

    return Array.isArray(status)
        ? (status as Record<string, unknown>[])
        : [status as Record<string, unknown>];
};

const isBitstringStatusListIndex = (value: unknown): value is string | number =>
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isInteger(value) && value >= 0);

export const isBitstringStatusListEntry = (status: unknown): status is BitstringStatusListEntry => {
    if (!status || typeof status !== 'object') return false;

    const record = status as Record<string, unknown>;

    return (
        record.type === 'BitstringStatusListEntry' &&
        (record.statusPurpose === 'revocation' || record.statusPurpose === 'suspension') &&
        isBitstringStatusListIndex(record.statusListIndex) &&
        typeof record.statusListCredential === 'string'
    );
};

/**
 * `statusListIndex` is a string per the Bitstring Status List spec, but real-world
 * issuers (including 1EdTech's conformance suite) emit it as a JSON number. Accept
 * both on input and normalize to string so downstream consumers see one shape.
 */
const normalizeBitstringStatusListEntry = (
    entry: BitstringStatusListEntry
): BitstringStatusListEntry => ({ ...entry, statusListIndex: String(entry.statusListIndex) });

export const getBitstringStatusListEntries = (credential: unknown): BitstringStatusListEntry[] => {
    if (!credential || typeof credential !== 'object' || Array.isArray(credential)) return [];

    const record = credential as Record<string, unknown>;
    const statuses = getCredentialStatusArray(record);

    return [
        ...statuses.filter(isBitstringStatusListEntry).map(normalizeBitstringStatusListEntry),
        ...getBitstringStatusListEntries(record.boostCredential),
    ];
};

export const getBitstringStatusListEntryForPurpose = (
    credential: unknown,
    statusPurpose: BitstringStatusPurpose
): BitstringStatusListEntry | undefined =>
    getBitstringStatusListEntries(credential).find(entry => entry.statusPurpose === statusPurpose);

export const getBitstringStatusListBit = (bitstring: Uint8Array, index: number): boolean => {
    if (!Number.isInteger(index) || index < 0) {
        throw new Error('Bitstring status list index is out of range');
    }

    const byte = bitstring[Math.floor(index / 8)] ?? 0;

    return (byte & (1 << index % 8)) !== 0;
};

export const setBitstringStatusListBit = (
    bitstring: Uint8Array,
    index: number,
    value: boolean
): void => {
    if (!Number.isInteger(index) || index < 0 || index >= bitstring.length * 8) {
        throw new Error('Bitstring status list index is out of range');
    }

    const byteIndex = Math.floor(index / 8);
    const mask = 1 << index % 8;
    const current = bitstring[byteIndex] ?? 0;

    bitstring[byteIndex] = value ? current | mask : current & ~mask;
};
