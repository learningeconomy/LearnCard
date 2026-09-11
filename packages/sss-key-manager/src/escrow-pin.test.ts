import { describe, expect, it } from 'vitest';

import { base64ToBuffer, bufferToBase64, bytesToHex, deriveKeyFromPassword } from './crypto';
import {
    ESCROW_PIN_MAX_ATTEMPTS,
    PIN_MAX_LENGTH,
    PIN_MIN_LENGTH,
    constantTimeEqualHex,
    derivePinProof,
    generatePinSalt,
    normalizePin,
    validatePin,
} from './escrow-pin';

describe('escrow PIN rules', () => {
    it('exports the policy limits', (): void => {
        expect(PIN_MIN_LENGTH).toBe(6);
        expect(PIN_MAX_LENGTH).toBe(12);
        expect(ESCROW_PIN_MAX_ATTEMPTS).toBe(10);
    });

    it.each([
        [' 135790\n', '135790'],
        ['13-57 90abc', '135790'],
        ['１３５７９０', '135790'],
        ['¹³⁵⁷⁹⁰', '135790'],
        ['001357', '001357'],
        ['abc! ', ''],
    ])('normalizes %j to %j', (raw, expected): void => {
        expect(normalizePin(raw)).toBe(expected);
    });

    it.each(['', 'abc', '13579', '1357902468135', '１２３４５'])(
        'rejects invalid normalized length %j',
        (pin): void => {
            expect(validatePin(pin)).toEqual({ ok: false, reason: 'length' });
        }
    );

    it.each([
        '123456',
        '654321',
        '000000',
        '111111',
        '121212',
        '112233',
        '123123',
        '696969',
        '123321',
        '999999999999',
        '2222222',
        '012345',
        '2345678',
        '0123456789',
        '9876543210',
        '8765432',
        '１２３４５６',
        ' 12-12-12 ',
    ])('rejects trivial PIN %j', (pin): void => {
        expect(validatePin(pin)).toEqual({ ok: false, reason: 'trivial' });
    });

    it.each(['135790', '001357', '135790246813', '1234568', '6543217', '１３５７９０'])(
        'accepts nontrivial PIN %j',
        (pin): void => {
            expect(validatePin(pin)).toEqual({ ok: true });
        }
    );
});

describe('escrow PIN proof', () => {
    it('generates independent 16-byte base64 salts', (): void => {
        const salt = generatePinSalt();
        expect(base64ToBuffer(salt)).toHaveLength(16);
        expect(bufferToBase64(base64ToBuffer(salt).buffer)).toBe(salt);
        expect(generatePinSalt()).not.toBe(salt);
    });

    it('is deterministic, normalized, salt-sensitive and uses the default password KDF', async (): Promise<void> => {
        const saltBytes = new Uint8Array(16).fill(1);
        const salt = bufferToBase64(saltBytes.buffer);
        const proof = await derivePinProof('135790', salt);
        expect(proof).toMatch(/^[0-9a-f]{64}$/);
        expect(await derivePinProof(' １３-５７９０ ', salt)).toBe(proof);
        expect(proof).toBe(bytesToHex(await deriveKeyFromPassword('135790', saltBytes)));
        expect(
            await derivePinProof('135790', bufferToBase64(new Uint8Array(16).fill(2).buffer))
        ).not.toBe(proof);
        expect(await derivePinProof('135791', salt)).not.toBe(proof);
    });

    it.each([0, 15, 17])('rejects a %i-byte salt', async (length): Promise<void> => {
        await expect(
            derivePinProof('135790', bufferToBase64(new Uint8Array(length).buffer))
        ).rejects.toThrow('salt length');
    });

    it('rejects malformed base64', async (): Promise<void> => {
        await expect(derivePinProof('135790', '!')).rejects.toThrow();
    });
});

describe('constantTimeEqualHex', () => {
    it.each([
        ['ab'.repeat(32), 'ab'.repeat(32), true],
        ['AB'.repeat(32), 'ab'.repeat(32), true],
        ['00', '00', true],
        ['00'.repeat(32), `01${'00'.repeat(31)}`, false],
        ['00'.repeat(32), `${'00'.repeat(31)}01`, false],
        ['00', '0000', false],
        ['', '', false],
        ['a', 'a', false],
        ['gg', 'gg', false],
        ['0g', '00', false],
        ['00', '0g', false],
    ])('compares %j and %j', (a, b, expected): void => {
        expect(constantTimeEqualHex(a, b)).toBe(expected);
    });
});
