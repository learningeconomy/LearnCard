import { QueryBuilder, BindParam } from 'neogma';

import { Credential, Profile } from '@models';

/**
 * Revoke a credential by setting its status to 'revoked' on the CREDENTIAL_RECEIVED relationship.
 * Handles both claimed credentials (existing relationship) and pending credentials (creates relationship).
 */
export const revokeCredentialReceived = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => {
    const revokedAt = new Date().toISOString();

    // Use MERGE to handle both cases:
    // 1. Relationship exists (claimed credential) - update status
    // 2. Relationship doesn't exist (pending credential) - create with revoked status
    const result = await new QueryBuilder(new BindParam({ revokedAt }))
        .match({ identifier: 'credential', model: Credential, where: { id: credentialId } })
        .match({ identifier: 'profile', model: Profile, where: { profileId } })
        .raw(`MERGE (credential)-[received:${Credential.getRelationshipByAlias('credentialReceived').name}]->(profile)`)
        .raw('ON CREATE SET received.status = "revoked", received.revokedAt = $revokedAt, received.date = $revokedAt')
        .raw('ON MATCH SET received.status = "revoked", received.revokedAt = $revokedAt')
        .return('received')
        .run();

    return result.records.length > 0;
};

/**
 * Check if a credential has been revoked for a specific profile
 */
export const isCredentialRevoked = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => {
    const result = await new QueryBuilder()
        .match({
            related: [
                { identifier: 'credential', model: Credential, where: { id: credentialId } },
                {
                    ...Credential.getRelationshipByAlias('credentialReceived'),
                    identifier: 'received',
                },
                { identifier: 'profile', model: Profile, where: { profileId } },
            ],
        })
        .where('received.status = "revoked"')
        .return('received')
        .run();

    return result.records.length > 0;
};
