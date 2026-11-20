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
    WEBHOOK_SECRET_JWE_PREFIX,
    decryptWebhookSecret,
    encryptWebhookSecret,
    generateWebhookSecret,
} from './integration-webhook-secret.helpers';

const jwe = { protected: 'header', recipients: [], iv: 'iv', ciphertext: 'ciphertext', tag: 'tag' };

describe('integration webhook secret helpers', () => {
    beforeEach(() => {
        createDagJwe.mockReset();
        decryptDagJwe.mockReset();
    });

    it('generates whsec_ plus 32 random bytes in base64url', () => {
        const first = generateWebhookSecret();
        const second = generateWebhookSecret();

        expect(first).toMatch(/^whsec_[A-Za-z0-9_-]{43}$/);
        expect(second).toMatch(/^whsec_[A-Za-z0-9_-]{43}$/);
        expect(first).not.toBe(second);
    });

    it('encrypts to the brain-service DID and never stores the plaintext', async () => {
        createDagJwe.mockResolvedValue(jwe);

        const stored = await encryptWebhookSecret('whsec_plaintext-value');

        expect(stored.startsWith(WEBHOOK_SECRET_JWE_PREFIX)).toBe(true);
        expect(stored).toBe(`lc-whsec-jwe:v1:${JSON.stringify(jwe)}`);
        expect(stored).not.toContain('whsec_plaintext-value');
        expect(createDagJwe).toHaveBeenCalledWith({ secret: 'whsec_plaintext-value' }, [
            'did:key:brain',
        ]);
    });

    it('decrypts a stored secret', async () => {
        decryptDagJwe.mockResolvedValue({ secret: 'whsec_plaintext-value' });

        await expect(decryptWebhookSecret(`lc-whsec-jwe:v1:${JSON.stringify(jwe)}`)).resolves.toBe(
            'whsec_plaintext-value'
        );
        expect(decryptDagJwe).toHaveBeenCalledWith(jwe);
    });

    it('rejects a stored value without the prefix', async () => {
        await expect(decryptWebhookSecret('whsec_plaintext-value')).rejects.toThrow(
            'Webhook secret is not encrypted'
        );
        expect(decryptDagJwe).not.toHaveBeenCalled();
    });

    it.each(['', null, {}, { secret: 123 }, { secret: '' }])(
        'rejects an invalid decrypted envelope: %j',
        async decrypted => {
            decryptDagJwe.mockResolvedValue(decrypted);

            await expect(decryptWebhookSecret('lc-whsec-jwe:v1:{}')).rejects.toThrow(
                'Unable to decrypt webhook secret'
            );
        }
    );
});
