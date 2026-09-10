import { describe, expect, it } from 'vitest';
import { revocationTarget } from './revoke';

describe('revocation target', () => {
    it('resolves an issued Boost to the exact recipient and template', () => {
        expect(
            revocationTarget(
                {
                    boostId: 'lc:boost',
                    credentialSubject: { id: 'did:web:network.learncard.com:users:alice' },
                },
                {}
            )
        ).toEqual({ templateUri: 'lc:boost', profileId: 'alice' });
    });
    it('supports explicit details and rejects ambiguous subjects', () => {
        expect(revocationTarget(null, { templateUri: 'lc:boost', recipient: 'alice' })).toEqual({
            templateUri: 'lc:boost',
            profileId: 'alice',
        });
        expect(() =>
            revocationTarget({ credentialSubject: [{ id: 'one' }, { id: 'two' }] }, {})
        ).toThrow('--template-uri');
    });
});
