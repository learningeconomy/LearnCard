import { BitstringStatusListEntryValidator, CredentialStatusValidator } from '@learncard/types';

import { getBitstringStatusListEntries, isBitstringStatusListEntry } from '../src';

const numericEntry = {
    type: 'BitstringStatusListEntry',
    statusPurpose: 'revocation',
    statusListIndex: 436,
    statusListCredential: 'https://example.com/status/1',
};

describe('Bitstring Status List interoperability', () => {
    it('accepts a status entry without an id', () => {
        expect(CredentialStatusValidator.parse(numericEntry)).toEqual(numericEntry);
    });

    it('accepts a non-standard numeric status list index', () => {
        expect(BitstringStatusListEntryValidator.parse(numericEntry)).toEqual(numericEntry);
        expect(isBitstringStatusListEntry(numericEntry)).toBe(true);
        expect(getBitstringStatusListEntries({ credentialStatus: numericEntry })).toEqual([
            numericEntry,
        ]);
    });

    it.each([-1, 1.5])('rejects an invalid numeric status list index: %s', statusListIndex => {
        const entry = { ...numericEntry, statusListIndex };

        expect(BitstringStatusListEntryValidator.safeParse(entry).success).toBe(false);
        expect(isBitstringStatusListEntry(entry)).toBe(false);
    });
});
