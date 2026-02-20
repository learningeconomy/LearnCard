import { QueryBuilder } from 'neogma';

import { CredentialInstance, Credential, Boost, Profile, ClaimHook, Role } from '@models';
import { ProfileType } from 'types/profile';
import { clearDidWebCacheForChildProfileManagers } from '@accesslayer/boost/relationships/update';
import { getBoostIdForCredentialInstance } from '@accesslayer/credential/relationships/read';
import { getBoostConnectionSourceKey } from '@helpers/connection.helpers';

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
/**
 * Remove/Cleanup CONNECTED_WITH relationships for the revoked profile that were sourced from the boost.
 * This mirrors the connection creation logic from ensureConnectionsForCredentialAcceptance.
 * We need to remove connections from:
 * - The direct boost (if autoConnectRecipients=true)
 * - All parent boosts with autoConnectRecipients=true
 * - All boosts targeted by AUTO_CONNECT claim hooks on the direct boost
 */
const processConnectionRevoke = async (
    profile: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    const { neogma } = await import('@instance');
    
    // Get all boost IDs that could have created connections for this credential
    // This mirrors the logic in ensureConnectionsForCredentialAcceptance
    const boostIdsQuery = `
        MATCH (c:Credential { id: $credentialId })-[:INSTANCE_OF]->(cb:Boost)
        WITH cb, CASE WHEN cb.autoConnectRecipients = true THEN [cb.id] ELSE [] END as directIds
        OPTIONAL MATCH (pb:Boost)-[:PARENT_OF*1..]->(cb)
        WHERE pb.autoConnectRecipients = true
        WITH cb, directIds, COLLECT(DISTINCT pb.id) as parentIds
        OPTIONAL MATCH (cb)<-[:HOOK_FOR]-(ch:ClaimHook { type: 'AUTO_CONNECT' })-[:TARGET]->(tb:Boost)
        WITH directIds, parentIds, COLLECT(DISTINCT tb.id) as hookIds
        RETURN directIds + parentIds + hookIds as boostIds
    `;

    const boostIdsResult = await neogma.queryRunner.run(boostIdsQuery, { 
        credentialId: credential.id 
    });
    
    const boostIds: string[] = boostIdsResult.records[0]?.get('boostIds') || [];
    
    if (boostIds.length === 0) {
        console.log('[processConnectionRevoke] No eligible boosts found for credential', credential.id);
        return;
    }

    const sourceKeys = boostIds.map(id => getBoostConnectionSourceKey(id));
    console.log('[processConnectionRevoke] Removing connections for profile', profile.profileId, 'with sourceKeys', sourceKeys);

    // First, check what connections exist for this profile with any of these source keys
    const debugQuery = `
        MATCH (p:Profile {profileId: $profileId})-[r:CONNECTED_WITH]-(other:Profile)
        WHERE r.sources IS NOT NULL AND ANY(key IN $sourceKeys WHERE key IN r.sources)
        RETURN other.profileId as otherProfileId, r.sources as sources
    `;
    const debugResult = await neogma.queryRunner.run(debugQuery, { 
        profileId: profile.profileId,
        sourceKeys 
    });
    console.log('[processConnectionRevoke] Found', debugResult.records.length, 'connections with matching sourceKeys');
    debugResult.records.forEach(r => {
        console.log('[processConnectionRevoke] - Connection to:', r.get('otherProfileId'), 'sources:', r.get('sources'));
    });

    // Now remove all matching source keys and delete connections that become empty
    const cypher = `
        MATCH (p:Profile {profileId: $profileId})-[r:CONNECTED_WITH]-(other:Profile)
        WHERE r.sources IS NOT NULL AND ANY(key IN $sourceKeys WHERE key IN r.sources)
        SET r.sources = [x IN r.sources WHERE NOT x IN $sourceKeys]
        WITH r, other
        WHERE size(r.sources) = 0
        DELETE r
        RETURN count(r) as deletedCount
    `;

    const result = await neogma.queryRunner.run(cypher, { 
        profileId: profile.profileId,
        sourceKeys 
    });
    
    const deletedCount = result.records[0]?.get('deletedCount');
    console.log('[processConnectionRevoke] Deleted', deletedCount, 'connection(s) that had only these sources');
};

export const processRevokeHooks = async (
    profile: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    await Promise.all([
        processPermissionsRevokeHooks(profile, credential),
        processAdminRevokeHooks(profile, credential),
        processAutoConnectRevokeHooks(profile, credential),
        processConnectionRevoke(profile, credential)
    ]);

    try {
        const boostId = await getBoostIdForCredentialInstance(credential);

        if (boostId) await clearDidWebCacheForChildProfileManagers(boostId);
    } catch (error) {
        console.error('Could not clear did:web cache for revoked boost credential', error);
    }
};
