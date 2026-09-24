import { describe, expect, it } from 'vitest';
import { UnsupportedSignInOperationError } from '../auth';

describe('UnsupportedSignInOperationError', () => {
    it('preserves the operation and provider for callers', () => {
        const error = new UnsupportedSignInOperationError('sendPhoneOtp', 'keycloak');
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('UnsupportedSignInOperationError');
        expect(error.operation).toBe('sendPhoneOtp');
        expect(error.providerType).toBe('keycloak');
        expect(error.message).toContain('sendPhoneOtp');
    });
});
