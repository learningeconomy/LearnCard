import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JWE, UnsignedVC } from '@learncard/types';

const mocks = vi.hoisted(() => ({ createOne: vi.fn(async input => input) }));
vi.mock('@models', () => ({ Credential: { createOne: mocks.createOne } }));

import { rememberIssuedCredentialStatus } from '@helpers/issuedCredentialStatus.helpers';
import { storeCredential } from './create';

const statusEntry = {
    id: 'https://network.example/status/1#42',
    type: 'BitstringStatusListEntry' as const,
    statusPurpose: 'revocation' as const,
    statusListIndex: '42',
    statusListCredential: 'https://network.example/status/1',
};
const unsigned = { credentialStatus: statusEntry } as unknown as UnsignedVC;
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

    it('persists public status coordinates from server-managed issuance', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const jwe = createJwe();
        rememberIssuedCredentialStatus(jwe, unsigned);
        await storeCredential(jwe);
        expect(mocks.createOne).toHaveBeenCalledWith(
            expect.objectContaining({
                credential: JSON.stringify(jwe),
                statusEntries: JSON.stringify([statusEntry]),
            })
        );
        expect(warn).not.toHaveBeenCalled();
    });

    it.each(['client-encrypted', 'copied'])(
        'warns when a %s JWE has no sidecar, without logging its payload',
        async source => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const original = createJwe();
            if (source === 'copied') rememberIssuedCredentialStatus(original, unsigned);
            const jwe = { ...original };
            await storeCredential(jwe);
            expect(warn).toHaveBeenCalledExactlyOnceWith(
                expect.stringContaining('Encrypted credential has no status metadata'),
                { credentialId: expect.any(String) }
            );
            expect(mocks.createOne.mock.calls[0]![0].statusEntries).toBeUndefined();
            expect(mocks.createOne.mock.calls[0]![0].credential).toBe(JSON.stringify(jwe));
        }
    );
});
