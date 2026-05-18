import type { BitstringStatusListEntry, BitstringStatusPurpose } from '@learncard/types';

export const getCredentialStatusArray = (credential: unknown): Record<string, unknown>[] => {
    if (!credential || typeof credential !== 'object' || Array.isArray(credential)) return [];

    const status = (credential as { credentialStatus?: unknown }).credentialStatus;
    if (!status) return [];

    return Array.isArray(status)
        ? (status as Record<string, unknown>[])
        : [status as Record<string, unknown>];
};

export const isBitstringStatusListEntry = (status: unknown): status is BitstringStatusListEntry => {
    if (!status || typeof status !== 'object') return false;

    const record = status as Record<string, unknown>;

    return (
        record.type === 'BitstringStatusListEntry' &&
        (record.statusPurpose === 'revocation' || record.statusPurpose === 'suspension') &&
        typeof record.statusListIndex === 'string' &&
        typeof record.statusListCredential === 'string'
    );
};

export const getBitstringStatusListEntries = (credential: unknown): BitstringStatusListEntry[] => {
    if (!credential || typeof credential !== 'object' || Array.isArray(credential)) return [];

    const record = credential as Record<string, unknown>;
    const statuses = getCredentialStatusArray(record);

    return [
        ...statuses.filter(isBitstringStatusListEntry),
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
