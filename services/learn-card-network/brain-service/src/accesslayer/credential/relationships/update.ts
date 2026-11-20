import { QueryBuilder, BindParam } from 'neogma';

import { Credential } from '@models';
import { mutateCredentialStatus } from '@helpers/credential-status-mutation.helpers';

/** Revoke the root credential and its public bit atomically. */
export const revokeCredentialReceived = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => mutateCredentialStatus(credentialId, profileId, 'revocation', true);

/** Suspend the root credential without changing an irreversible revocation. */
export const suspendCredentialReceived = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => mutateCredentialStatus(credentialId, profileId, 'suspension', true);

/** Failed bit writes roll back the relationship, so unsuspension remains retryable. */
export const unsuspendCredentialReceived = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => mutateCredentialStatus(credentialId, profileId, 'suspension', false);

/** Check if a credential has been revoked for a specific profile. */
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
