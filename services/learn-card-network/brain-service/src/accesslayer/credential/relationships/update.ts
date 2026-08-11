import { QueryBuilder, BindParam } from 'neogma';

import { Credential } from '@models';
import { setCredentialBitstringStatus } from '@helpers/status-list.helpers';
import { neogma } from '@instance';
import {
    setCredentialBitstringStatusWithResult,
    type CredentialBitstringStatusUpdateResult,
} from '@helpers/status-list.helpers';

export interface RevokeCredentialForProfileResult {
    found: boolean;
    wasAlreadyRevoked: boolean;
    statusList: CredentialBitstringStatusUpdateResult;
}

export const revokeCredentialForProfile = async (
    credentialId: string,
    profileId: string
): Promise<RevokeCredentialForProfileResult> => {
    const revokedAt = new Date().toISOString();
    const result = await neogma.queryRunner.run(
        `MATCH (credential:Credential {id: $credentialId})
         MATCH (sender)-[sent:CREDENTIAL_SENT {to: $profileId}]->(credential)
         WHERE sender:Profile OR sender:AppStoreListing
         OPTIONAL MATCH (credential)-[received:CREDENTIAL_RECEIVED]->(:Profile {profileId: $profileId})
         WITH sent,
              sent.status AS previousSentStatus,
              sent.revokedAt AS sentRevokedAt,
              received.status AS previousReceivedStatus,
              received.revokedAt AS receivedRevokedAt
         WITH sent,
              previousSentStatus,
              previousReceivedStatus,
              CASE
                  WHEN previousSentStatus = "revoked"
                      THEN coalesce(sentRevokedAt, receivedRevokedAt, $revokedAt)
                  WHEN previousReceivedStatus = "revoked"
                      THEN coalesce(receivedRevokedAt, sentRevokedAt, $revokedAt)
                  ELSE $revokedAt
              END AS effectiveRevokedAt
         SET sent.status = "revoked",
             sent.revokedAt = effectiveRevokedAt
         RETURN previousSentStatus, previousReceivedStatus`,
        { credentialId, profileId, revokedAt }
    );

    if (result.records.length === 0) {
        return { found: false, wasAlreadyRevoked: false, statusList: 'failed' };
    }

    let statusList: CredentialBitstringStatusUpdateResult = 'failed';
    try {
        statusList = await setCredentialBitstringStatusWithResult(credentialId, 'revocation', true);
    } catch (error) {
        console.error('[revokeCredentialForProfile] status-list update failed', {
            credentialId,
            error,
        });
    }

    return {
        found: true,
        wasAlreadyRevoked:
            result.records[0]?.get('previousSentStatus') === 'revoked' ||
            result.records[0]?.get('previousReceivedStatus') === 'revoked',
        statusList,
    };
};

/**
 * Revoke a credential by setting its issuer-controlled status on the CREDENTIAL_SENT relationship.
 * This applies to both pending and claimed credentials without creating a received relationship.
 */
export const revokeCredentialReceived = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => {
    const result = await revokeCredentialForProfile(credentialId, profileId);
    if (!result.found) return false;
    if (result.statusList === 'failed') {
        throw new Error('Failed to update credential status list');
    }
    if (result.statusList === 'missing-entry') {
        console.warn('[revokeCredentialReceived] verifiable revocation unavailable', {
            credentialId,
            reason: result.statusList,
        });
    }

    return true;
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
        const bitSet = await setCredentialBitstringStatus(credentialId, 'suspension', true);
        if (!bitSet) {
            // Relationship marked suspended but the credential has no 'suspension' status
            // entry, so the verifiable bit was NOT set. The authoritative relationship
            // status still drives the UI; log so the gap is visible.
            console.warn(
                `[suspendCredentialReceived] credential ${credentialId} has no verifiable 'suspension' status entry; bitstring bit not set`
            );
        }
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
        const bitCleared = await setCredentialBitstringStatus(credentialId, 'suspension', false);
        if (!bitCleared) {
            console.warn(
                `[unsuspendCredentialReceived] credential ${credentialId} has no verifiable 'suspension' status entry; bitstring bit not cleared`
            );
        }
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
