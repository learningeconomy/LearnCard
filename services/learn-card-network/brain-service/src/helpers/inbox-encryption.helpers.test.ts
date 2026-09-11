import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createDagJwe, decryptDagJwe } = vi.hoisted(() => ({
    createDagJwe: vi.fn(),
    decryptDagJwe: vi.fn(),
}));

vi.mock('@helpers/learnCard.helpers', () => ({
    getLearnCard: async () => ({
        id: { did: () => 'did:key:brain' },
        invoke: { createDagJwe, decryptDagJwe },
    }),
}));

import {
    decryptInboxCredential,
    encryptInboxCredential,
    isEncryptedInboxCredential,
} from './inbox-encryption.helpers';

describe('inbox payload encryption', () => {
    beforeEach(() => {
        createDagJwe.mockReset();
        decryptDagJwe.mockReset();
    });

    it('encrypts a payload to the brain-service DID and decrypts it transiently', async () => {
        const payload = JSON.stringify({ sensitiveMarker: 'learner-transcript' });
        const jwe = {
            protected: 'header',
            recipients: [],
            iv: 'iv',
            ciphertext: 'ciphertext',
            tag: 'tag',
        };
        createDagJwe.mockResolvedValue(jwe);
        decryptDagJwe.mockResolvedValue({ credential: payload });

        const encrypted = await encryptInboxCredential(payload);

        expect(encrypted).not.toContain('learner-transcript');
        expect(isEncryptedInboxCredential(encrypted)).toBe(true);
        expect(createDagJwe).toHaveBeenCalledWith({ credential: payload }, ['did:key:brain']);
        await expect(decryptInboxCredential(encrypted)).resolves.toBe(payload);
        expect(decryptDagJwe).toHaveBeenCalledWith(jwe);
    });

    it('temporarily reads legacy plaintext for rolling migration', async () => {
        await expect(decryptInboxCredential('{"legacy":true}')).resolves.toBe('{"legacy":true}');
    });

    it('rejects a payload that has already been wiped', async () => {
        await expect(decryptInboxCredential()).rejects.toThrow('already been removed');
    });

    it.each(['', null, {}, { credential: 123 }])(
        'rejects an invalid decrypted envelope: %j',
        async decrypted => {
            decryptDagJwe.mockResolvedValue(decrypted);
            await expect(decryptInboxCredential('lc-inbox-jwe:v1:{}')).rejects.toThrow(
                'Unable to decrypt'
            );
        }
    );
});
