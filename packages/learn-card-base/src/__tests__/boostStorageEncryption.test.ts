import { describe, it, expect, vi } from 'vitest';

import {
    shouldEncryptForBoost,
    encryptCredentialForBoost,
    prepareCredentialForStorage,
    getJweRecipients,
} from '../helpers/boostStorageEncryption';

describe('getJweRecipients', () => {
    it('returns [userDid] when no recoveryKeyDid', () => {
        expect(getJweRecipients('did:key:user')).toEqual(['did:key:user']);
    });

    it('returns [userDid, recoveryKeyDid] when recoveryKeyDid provided', () => {
        expect(getJweRecipients('did:key:user', 'did:key:recovery')).toEqual([
            'did:key:user',
            'did:key:recovery',
        ]);
    });
});

describe('shouldEncryptForBoost', () => {
    it('returns true for encrypted-only boost', () => {
        expect(shouldEncryptForBoost({ storage: 'encrypted-only' })).toBe(true);
    });

    it('returns false for plaintext boost', () => {
        expect(shouldEncryptForBoost({ storage: 'plaintext' })).toBe(false);
    });

    it('returns false when storage field is missing', () => {
        expect(shouldEncryptForBoost({})).toBe(false);
    });
});

describe('prepareCredentialForStorage', () => {
    it('returns credential unchanged for plaintext boost', async () => {
        const credential = { id: 'test', type: ['VerifiableCredential'] };
        const boostTemplate = { storage: 'plaintext' };
        const learnCard = { invoke: { createDagJwe: vi.fn() } };

        const result = await prepareCredentialForStorage(credential, boostTemplate, ['did:key:abc'], learnCard);

        expect(result).toBe(credential);
        expect(learnCard.invoke.createDagJwe).not.toHaveBeenCalled();
    });

    it('calls createDagJwe for encrypted-only boost', async () => {
        const credential = { id: 'test', type: ['VerifiableCredential'] };
        const boostTemplate = { storage: 'encrypted-only' };
        const jwe = { protected: 'abc', recipients: [], ciphertext: 'xyz', iv: 'iv', tag: 'tag' };
        const learnCard = { invoke: { createDagJwe: vi.fn().mockResolvedValue(jwe) } };

        const result = await prepareCredentialForStorage(credential, boostTemplate, ['did:key:abc'], learnCard);

        expect(learnCard.invoke.createDagJwe).toHaveBeenCalledWith(credential, ['did:key:abc']);
        expect(result).toBe(jwe);
    });

    it('includes recoveryKeyDid in JWE recipients when provided', async () => {
        const credential = { id: 'test', type: ['VerifiableCredential'] };
        const boostTemplate = { storage: 'encrypted-only' };
        const jwe = { protected: 'abc', recipients: [], ciphertext: 'xyz', iv: 'iv', tag: 'tag' };
        const learnCard = { invoke: { createDagJwe: vi.fn().mockResolvedValue(jwe) } };

        await prepareCredentialForStorage(credential, boostTemplate, ['did:key:user'], learnCard, 'did:key:recovery');

        expect(learnCard.invoke.createDagJwe).toHaveBeenCalledWith(credential, ['did:key:user', 'did:key:recovery']);
    });
});
