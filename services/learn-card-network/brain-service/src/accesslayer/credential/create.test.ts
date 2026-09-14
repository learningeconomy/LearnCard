import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JWE } from '@learncard/types';
import type { IssuedCredential } from '../../types/credential';

const mocks = vi.hoisted(() => ({ createOne: vi.fn(async input => input) }));
vi.mock('@models', () => ({ Credential: { createOne: mocks.createOne } }));

import { storeCredential } from './create';

const statusEntry = {
    id: 'https://network.example/status/1#42',
    type: 'BitstringStatusListEntry' as const,
    statusPurpose: 'revocation' as const,
    statusListIndex: '42',
    statusListCredential: 'https://network.example/status/1',
};
const createJwe = (): JWE => ({
    protected: 'header',
    iv: 'iv',
    ciphertext: 'ciphertext',
    tag: 'tag',
    recipients: [],
});

describe('encrypted credential status storage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it('persists public status coordinates after serializing an issuance result', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const jwe = createJwe();
        const issued: IssuedCredential = {
            kind: 'issued-credential',
            credential: jwe,
            statusEntries: [statusEntry],
        };
        await storeCredential(JSON.parse(JSON.stringify(issued)));
        expect(mocks.createOne).toHaveBeenCalledWith(
            expect.objectContaining({
                credential: JSON.stringify(jwe),
                statusEntries: JSON.stringify([statusEntry]),
            })
        );
        expect(warn).not.toHaveBeenCalled();
    });

    it('warns when a client-encrypted JWE has no metadata, without logging its payload', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const original = createJwe();
        const jwe = { ...original };
        await storeCredential(jwe);
        expect(warn).toHaveBeenCalledExactlyOnceWith(
            expect.stringContaining('Encrypted credential has no status metadata'),
            { credentialId: expect.any(String) }
        );
        expect(mocks.createOne.mock.calls[0]![0].statusEntries).toBeUndefined();
        expect(mocks.createOne.mock.calls[0]![0].credential).toBe(JSON.stringify(jwe));
    });

    it('rejects internal issuance results that lost their status metadata before writing', async () => {
        const issued = { kind: 'issued-credential', credential: createJwe() } as IssuedCredential;
        await expect(storeCredential(issued)).rejects.toThrow();
        expect(mocks.createOne).not.toHaveBeenCalled();
    });

    it('does not treat a wire JWE with extra envelope-like fields as trusted issuance metadata', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const jwe = {
            ...createJwe(),
            kind: 'issued-credential',
            credential: createJwe(),
            statusEntries: [statusEntry],
        };
        await storeCredential(jwe);
        expect(mocks.createOne.mock.calls[0]![0].statusEntries).toBeUndefined();
        expect(mocks.createOne.mock.calls[0]![0].credential).toBe(JSON.stringify(jwe));
    });
});
