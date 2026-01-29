import { QueryBuilder, BindParam } from 'neogma';

import { Credential, Profile } from '@models';

/**
 * Revoke a credential by setting its status to 'revoked' on the CREDENTIAL_RECEIVED relationship
 */
export const revokeCredentialReceived = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => {
    const revokedAt = new Date().toISOString();

    const result = await new QueryBuilder(new BindParam({ revokedAt }))
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
        .set('received.status = "revoked"')
        .set('received.revokedAt = $revokedAt')
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
