import { describe, expect, it } from 'vitest';
import { hasGroupRemovalFailures, isRemovableGroupMemberRole } from '../groupRemoval.helpers';

describe('hasGroupRemovalFailures', () => {
    it('accepts new and already-revoked complete outcomes', () => {
        expect(
            hasGroupRemovalFailures({
                revokedCredentialUris: ['credential:1'],
                alreadyRevokedCredentialUris: [],
                failedCredentialUris: [],
            })
        ).toBe(false);
        expect(
            hasGroupRemovalFailures({
                revokedCredentialUris: [],
                alreadyRevokedCredentialUris: ['credential:1'],
                failedCredentialUris: [],
            })
        ).toBe(false);
    });

    it('reports a retryable partial outcome when any URI failed', () => {
        expect(
            hasGroupRemovalFailures({
                revokedCredentialUris: ['credential:1'],
                alreadyRevokedCredentialUris: [],
                failedCredentialUris: ['credential:2'],
            })
        ).toBe(true);
    });
});

describe('isRemovableGroupMemberRole', () => {
    it('allows Leader rows through the unified group removal path', () => {
        expect(isRemovableGroupMemberRole('Leader')).toBe(true);
    });
});
