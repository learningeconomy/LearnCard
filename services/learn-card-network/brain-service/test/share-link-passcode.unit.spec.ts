import { describe, expect, it } from 'vitest';

import { hashSharePasscode, verifySharePasscode } from '../src/helpers/share-link-passcode';

describe('share-link passcodes', () => {
    it('stores an Argon2id PHC hash and verifies without retaining plaintext', async () => {
        const passcode = 'correct horse battery staple';
        const hash = await hashSharePasscode(passcode);

        expect(hash).toMatch(/^\$argon2id\$/);
        expect(hash).not.toContain(passcode);
        await expect(verifySharePasscode(hash, passcode)).resolves.toBe(true);
        await expect(verifySharePasscode(hash, 'wrong passcode')).resolves.toBe(false);
    });
});
