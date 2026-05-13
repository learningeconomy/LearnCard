import { QueryBuilder, BindParam } from 'neogma';

import { Credential } from '@models';
import { setCredentialBitstringStatus } from '@helpers/status-list.helpers';

/**
 * Revoke a credential by setting its issuer-controlled status on the CREDENTIAL_SENT relationship.
 * This applies to both pending and claimed credentials without creating a received relationship.
 */
export const revokeCredentialReceived = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => {
    const revokedAt = new Date().toISOString();

    const result = await new QueryBuilder(new BindParam({ profileId, revokedAt }))
        .match({ identifier: 'credential', model: Credential, where: { id: credentialId } })
        .raw(
            `MATCH (sender)-[sent:CREDENTIAL_SENT {to: $profileId}]->(credential)
             WHERE sender:Profile OR sender:AppStoreListing
             SET sent.status = "revoked",
                 sent.revokedAt = $revokedAt
             RETURN sent`
        )
        .run();

    if (result.records.length > 0) {
        await setCredentialBitstringStatus(credentialId, 'revocation', true);
    }

    return result.records.length > 0;
};

/**
 * Suspend a credential by setting its issuer-controlled status on the CREDENTIAL_SENT relationship.
 * If the credential has already been revoked, the revoked relationship state is preserved.
 */
export const suspendCredentialReceived = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => {
    const suspendedAt = new Date().toISOString();

    const result = await new QueryBuilder(new BindParam({ profileId, suspendedAt }))
        .match({ identifier: 'credential', model: Credential, where: { id: credentialId } })
        .raw(
            `MATCH (sender)-[sent:CREDENTIAL_SENT {to: $profileId}]->(credential)
             WHERE (sender:Profile OR sender:AppStoreListing)
               AND coalesce(sent.status, "") <> "revoked"
             SET sent.status = "suspended",
                 sent.suspendedAt = $suspendedAt
             RETURN sent`
        )
        .run();

    if (result.records.length > 0) {
        await setCredentialBitstringStatus(credentialId, 'suspension', true);
    }

    return result.records.length > 0;
};

/**
 * Clear a reversible suspension. Revocation remains irreversible and is not cleared.
 */
export const unsuspendCredentialReceived = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => {
    const unsuspendedAt = new Date().toISOString();

    const result = await new QueryBuilder(new BindParam({ profileId, unsuspendedAt }))
        .match({ identifier: 'credential', model: Credential, where: { id: credentialId } })
        .raw(
            `MATCH (sender)-[sent:CREDENTIAL_SENT {to: $profileId}]->(credential)
             WHERE (sender:Profile OR sender:AppStoreListing)
               AND sent.status = "suspended"
             SET sent.status = null,
                 sent.unsuspendedAt = $unsuspendedAt
             RETURN sent`
        )
        .run();

    if (result.records.length > 0) {
        await setCredentialBitstringStatus(credentialId, 'suspension', false);
    }

    return result.records.length > 0;
};

/**
 * Check if a credential has been revoked for a specific profile
 */
export const isCredentialRevoked = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ profileId }))
        .match({ identifier: 'credential', model: Credential, where: { id: credentialId } })
        .raw(
            `OPTIONAL MATCH (sender)-[sent:CREDENTIAL_SENT {to: $profileId}]->(credential)
             WHERE sender:Profile OR sender:AppStoreListing
             OPTIONAL MATCH (credential)-[received:${
                 Credential.getRelationshipByAlias('credentialReceived').name
             }]->(:Profile {profileId: $profileId})
             WITH sent, received
             WHERE sent.status = "revoked" OR received.status = "revoked"
             RETURN sent, received
             LIMIT 1`
        )
        .run();

    return result.records.length > 0;
};
