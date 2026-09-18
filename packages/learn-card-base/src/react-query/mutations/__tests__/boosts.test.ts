import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ resolveSharedCredential: vi.fn() }));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getEndorsementTargetId: async (credential: { id?: string }) => credential.id,
    resolveSharedCredential: mocks.resolveSharedCredential,
}));

import {
    getSharedCredentialIndexQueries,
    sharedCredentialIndexMatchesCredential,
} from '../mutation.helpers';

describe('shared credential cache identity', () => {
    it('selects distinct presentations under LearnCloud OR-query semantics', () => {
        const [firstQuery] = getSharedCredentialIndexQueries(
            'lc:credential:shared-record',
            'urn:uuid:credential-a'
        );
        const [secondQuery] = getSharedCredentialIndexQueries(
            'lc:credential:shared-record',
            'urn:uuid:credential-b'
        );
        const records = [
            { ...firstQuery, uri: 'presentation:a' },
            { ...secondQuery, uri: 'presentation:b' },
        ];
        const readWithOrSemantics = (query: object) =>
            records.filter(record =>
                Object.entries(query).some(
                    ([field, value]) => (record as Record<string, unknown>)[field] === value
                )
            );

        expect(readWithOrSemantics(firstQuery)).toEqual([records[0]]);
        expect(readWithOrSemantics(secondQuery)).toEqual([records[1]]);
    });

    it('falls back from the credential key to legacy record identity', () => {
        expect(
            getSharedCredentialIndexQueries('lc:credential:shared-record', 'urn:uuid:credential-a')
        ).toEqual([
            {
                sharedCredentialKey: JSON.stringify([
                    'lc:credential:shared-record',
                    'urn:uuid:credential-a',
                ]),
            },
            { sharedCredentialUri: 'lc:credential:shared-record' },
        ]);
    });

    it('does not reuse credential A’s legacy presentation for credential B', async () => {
        const legacyRecord = {
            uri: 'presentation:a',
            randomSeed: 'seed-a',
            pin: '1234',
        };
        mocks.resolveSharedCredential.mockResolvedValue({ id: 'urn:uuid:credential-a' });

        await expect(
            sharedCredentialIndexMatchesCredential(legacyRecord, 'urn:uuid:credential-b')
        ).resolves.toBe(false);
        await expect(
            sharedCredentialIndexMatchesCredential(legacyRecord, 'urn:uuid:credential-a')
        ).resolves.toBe(true);
    });

    it('keeps the legacy record-only identity for unsigned credentials', () => {
        expect(getSharedCredentialIndexQueries('lc:credential:unsigned')).toEqual([
            {
                sharedCredentialUri: 'lc:credential:unsigned',
            },
        ]);
    });
});
