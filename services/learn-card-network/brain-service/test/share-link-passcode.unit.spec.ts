import { describe, expect, it } from 'vitest';

import {
    hashSharePasscode,
    SharePasscodeCapacityError,
    verifySharePasscode,
} from '../src/helpers/share-link-passcode';

describe('share-link passcodes', () => {
    it('stores an Argon2id PHC hash and verifies without retaining plaintext', async () => {
        const passcode = 'correct horse battery staple';
        const hash = await hashSharePasscode(passcode);

        expect(hash).toMatch(/^\$argon2id\$/);
        expect(hash).not.toContain(passcode);
        await expect(verifySharePasscode(hash, passcode)).resolves.toBe(true);
        await expect(verifySharePasscode(hash, 'wrong passcode')).resolves.toBe(false);
    });

    it('rejects excess concurrent verifications without starting another Argon2 job', async () => {
        const hash = await hashSharePasscode('2468');
        const inFlight = Array.from({ length: 4 }, () => verifySharePasscode(hash, '2468'));
        await expect(verifySharePasscode(hash, '2468')).rejects.toBeInstanceOf(
            SharePasscodeCapacityError
        );
        await expect(Promise.all(inFlight)).resolves.toEqual([true, true, true, true]);
        await expect(verifySharePasscode(hash, '2468')).resolves.toBe(true);
    });
});
