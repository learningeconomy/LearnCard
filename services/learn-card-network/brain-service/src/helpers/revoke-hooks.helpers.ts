import { QueryBuilder } from 'neogma';

import { CredentialInstance, Credential, Boost, Profile, ClaimHook, Role } from '@models';
import { ProfileType } from 'types/profile';
import { clearDidWebCacheForChildProfileManagers } from '@accesslayer/boost/relationships/update';
import { getBoostIdForCredentialInstance } from '@accesslayer/credential/relationships/read';

/**
 * Reverse the effects of GRANT_PERMISSIONS claim hooks when a credential is revoked.
 * Removes HAS_ROLE relationships that were granted via claim hooks for the revoked credential.
 */
const processPermissionsRevokeHooks = async (
    profile: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    // Find all permissions that were granted via claim hooks for this credential's boost
    // and delete the HAS_ROLE relationships for the profile on target boosts
    await new QueryBuilder()
        .match({
            related: [
                { identifier: 'credential', model: Credential, where: { id: credential.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'out',
                },
                { identifier: 'boost', model: Boost },
                { ...ClaimHook.getRelationshipByAlias('hookFor'), direction: 'in' },
                { identifier: 'claimHook', model: ClaimHook, where: { type: 'GRANT_PERMISSIONS' } },
                ClaimHook.getRelationshipByAlias('target'),
                { identifier: 'targetBoost', model: Boost },
            ],
        })
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' })
        .match({
            related: [
                { identifier: 'claimHook' },
                ClaimHook.getRelationshipByAlias('roleToGrant'),
                { identifier: 'role', model: Role },
            ],
        })
        .match({
            optional: false,
            related: [
                { identifier: 'profile' },
                `-[hasRole:${Boost.getRelationshipByAlias('hasRole').name}]->`,
                { identifier: 'targetBoost' },
            ],
        })
        .where('hasRole.roleId = role.id')
        .raw('DELETE hasRole')
        .run();
};

/**
 * Reverse the effects of AUTO_CONNECT claim hooks when a credential is revoked.
 * Removes AUTO_CONNECT_RECIPIENT relationships for the profile on target boosts.
 */
const processAutoConnectRevokeHooks = async (
    profile: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    await new QueryBuilder()
        .match({
            related: [
                { identifier: 'credential', model: Credential, where: { id: credential.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'out',
                },
                { identifier: 'claimBoost', model: Boost },
                { ...ClaimHook.getRelationshipByAlias('hookFor'), direction: 'in' },
                { identifier: 'claimHook', model: ClaimHook, where: { type: 'AUTO_CONNECT' } },
                ClaimHook.getRelationshipByAlias('target'),
                { identifier: 'targetBoost', model: Boost },
            ],
        })
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' })
        .match({
            optional: false,
            related: [
                { identifier: 'targetBoost' },
                `-[autoConnect:${Boost.getRelationshipByAlias('autoConnectRecipient').name}]->`,
                { identifier: 'profile' },
            ],
        })
        .raw('DELETE autoConnect')
        .run();
};

/**
 * Reverse the effects of ADD_ADMIN claim hooks when a credential is revoked.
 * Removes admin role relationships for the profile on target boosts.
 */
const processAdminRevokeHooks = async (
    profile: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    // Find admin roles that were granted via ADD_ADMIN claim hooks
    // We need to be careful here - we should only remove admin roles that were
    // specifically granted via the claim hook, not other admin roles
    await new QueryBuilder()
        .match({
            related: [
                { identifier: 'credential', model: Credential, where: { id: credential.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'out',
                },
                { identifier: 'boost', model: Boost },
                { ...ClaimHook.getRelationshipByAlias('hookFor'), direction: 'in' },
                { identifier: 'claimHook', model: ClaimHook, where: { type: 'ADD_ADMIN' } },
                ClaimHook.getRelationshipByAlias('target'),
                { identifier: 'targetBoost', model: Boost },
            ],
        })
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' })
        .match({
            related: [
                { identifier: 'adminRole', model: Role, where: { role: 'admin' } },
            ],
        })
        .match({
            optional: false,
            related: [
                { identifier: 'profile' },
                `-[hasRole:${Boost.getRelationshipByAlias('hasRole').name}]->`,
                { identifier: 'targetBoost' },
            ],
        })
        .where('hasRole.roleId = adminRole.id')
        .raw('DELETE hasRole')
        .run();
};

/**
 * Process all revoke hooks for a credential.
 * This reverses the effects of claim hooks that were triggered when the credential was claimed.
 * 
 * @param profile The profile whose credential is being revoked
 * @param credential The credential instance being revoked
 */
export const processRevokeHooks = async (
    profile: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    await Promise.all([
        processPermissionsRevokeHooks(profile, credential),
        processAdminRevokeHooks(profile, credential),
        processAutoConnectRevokeHooks(profile, credential),
    ]);

    try {
        const boostId = await getBoostIdForCredentialInstance(credential);

        if (boostId) await clearDidWebCacheForChildProfileManagers(boostId);
    } catch (error) {
        console.error('Could not clear did:web cache for revoked boost credential', error);
    }
};
