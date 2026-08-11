import { describe, expect, it } from 'bun:test';
import { getGroupRemovalOutcome, isRemovableGroupMemberRole } from '../groupRemoval.helpers';

describe('getGroupRemovalOutcome', () => {
    it('accepts new and already-revoked complete outcomes', () => {
        expect(
            getGroupRemovalOutcome({
                revokedCredentialUris: ['credential:1'],
                alreadyRevokedCredentialUris: [],
                failedCredentialUris: [],
            })
        ).toBe('complete');
        expect(
            getGroupRemovalOutcome({
                revokedCredentialUris: [],
                alreadyRevokedCredentialUris: ['credential:1'],
                failedCredentialUris: [],
            })
        ).toBe('complete');
    });

    it('reports a retryable partial outcome when any URI failed', () => {
        expect(
            getGroupRemovalOutcome({
                revokedCredentialUris: ['credential:1'],
                alreadyRevokedCredentialUris: [],
                failedCredentialUris: ['credential:2'],
            })
        ).toBe('partial');
    });
});

describe('isRemovableGroupMemberRole', () => {
    it('allows Leader rows through the unified group removal path', () => {
        expect(isRemovableGroupMemberRole('Leader')).toBe(true);
    });
});
