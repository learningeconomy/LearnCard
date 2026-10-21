import { describe, it, expect, vi } from 'vitest';
import { toFriendlyRecoveryError } from './recoveryErrors';
import * as m from '../../paraglide/messages.js';

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: vi.fn() }),
}));

vi.mock('../../paraglide/messages.js', () => ({
    'recovery.error.invalidPhrase': () => 'invalid phrase',
    'recovery.error.invalidPassword': () => 'invalid password',
    'recovery.error.invalidCode': () => 'invalid code',
    'recovery.error.network': () => 'network error',
    'recovery.error.default': () => 'default error',
}));

describe('toFriendlyRecoveryError', () => {
    it('maps phrase errors', () => {
        expect(toFriendlyRecoveryError(new Error('invalid phrase'))).toBe('invalid phrase');
        expect(toFriendlyRecoveryError(new Error('wrong word'))).toBe('invalid phrase');
        expect(toFriendlyRecoveryError(new Error('bad mnemonic'))).toBe('invalid phrase');
    });

    it('maps password errors', () => {
        expect(toFriendlyRecoveryError(new Error('failed to decrypt'))).toBe('invalid password');
        expect(toFriendlyRecoveryError(new Error('wrong password'))).toBe('invalid password');
    });

    it('maps code errors', () => {
        expect(toFriendlyRecoveryError(new Error('invalid code'))).toBe('invalid code');
        expect(toFriendlyRecoveryError(new Error('code expired'))).toBe('invalid code');
    });

    it('maps network errors', () => {
        expect(toFriendlyRecoveryError(new Error('network error'))).toBe('network error');
        expect(toFriendlyRecoveryError(new Error('failed to fetch'))).toBe('network error');
    });

    it('maps unknown errors to default', () => {
        expect(toFriendlyRecoveryError(new Error('something else'))).toBe('default error');
        expect(toFriendlyRecoveryError('string error')).toBe('default error');
        expect(toFriendlyRecoveryError(null)).toBe('default error');
    });
});
