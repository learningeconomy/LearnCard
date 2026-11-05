import { TRPCError } from '@trpc/server';
import type { BitstringStatusPurpose } from '@learncard/types';
import type { Transaction } from 'neo4j-driver';

import { neogma } from '@instance';
import {
    CREDENTIAL_STATUS_ROOT_QUERY,
    getStatusEntriesForCredential,
    setStatusListEntryBit,
} from './status-list.helpers';

/** Commit relationship state and signed public bits together, including all managed versions. */
export const mutateCredentialStatus = async (
    credentialId: string,
    profileId: string,
    purpose: BitstringStatusPurpose,
    value: boolean
): Promise<boolean> =>
    neogma.getTransaction(null, async tx => {
        const result = await tx.run(
            `${CREDENTIAL_STATUS_ROOT_QUERY}
         MATCH (sender)-[sent:CREDENTIAL_SENT {to: $profileId}]->(root)
         WHERE sender:Profile OR sender:AppStoreListing
         SET root._statusMutationLock = $now
         REMOVE root._statusMutationLock
         FOREACH (_ IN CASE WHEN refresh IS NULL THEN [] ELSE [1] END |
             SET refresh._statusBindingLock = true REMOVE refresh._statusBindingLock)
         WITH root, refresh, sent
         OPTIONAL MATCH (issuer:Profile)-[:CREDENTIAL_SENT]->(root)
         RETURN root.id AS rootId, sent.status AS status,
                 coalesce(refresh.issuerProfileId, root.statusOwnerProfileId, issuer.profileId) AS owner`,
            { credentialId, profileId, now: new Date().toISOString() }
        );
        if (result.records.length === 0) return false;
        const row = result.records[0]!;
        if (purpose === 'suspension' && row.get('status') === 'revoked') return false;
        if (!value && row.get('status') !== 'suspended') return false;
        const rootId = String(row.get('rootId'));
        const allEntries = await getStatusEntriesForCredential(rootId, tx);
        const entries = allEntries.filter(entry => entry.statusPurpose === purpose);
        if (allEntries.length > 0 && entries.length === 0) {
            console.warn(
                '[mutateCredentialStatus] no public status entry for purpose; relationship-only update',
                { rootId, purpose }
            );
        }
        for (const entry of [...entries].sort((a, b) =>
            a.statusListCredential.localeCompare(b.statusListCredential)
        )) {
            if (!(await setStatusListEntryBit(entry, value, String(row.get('owner')), tx))) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Public credential status could not be updated; retry the operation',
                });
            }
        }
        await tx.run(
            `MATCH (root:Credential {id: $rootId})<-[sent:CREDENTIAL_SENT {to: $profileId}]-(sender)
         WHERE sender:Profile OR sender:AppStoreListing
         SET sent.status = $status
         FOREACH (_ IN CASE WHEN $purpose = 'revocation' THEN [1] ELSE [] END |
             SET sent.revokedAt = $now)
         FOREACH (_ IN CASE WHEN $purpose = 'suspension' AND $value THEN [1] ELSE [] END |
             SET sent.suspendedAt = $now)
         FOREACH (_ IN CASE WHEN NOT $value THEN [1] ELSE [] END |
             SET sent.unsuspendedAt = $now)
         WITH root
         OPTIONAL MATCH (refresh:CredentialRefresh)-[:ROOT]->(root)
         FOREACH (_ IN CASE WHEN refresh IS NOT NULL AND $purpose = 'revocation' THEN [1] ELSE [] END |
             SET refresh.state = 'revoked', refresh.updatedAt = $now)`,
            {
                rootId,
                profileId,
                purpose,
                value,
                status: purpose === 'revocation' ? 'revoked' : value ? 'suspended' : null,
                now: new Date().toISOString(),
            }
        );
        return true;
    });

/** Reconcile historical lifecycle state while holding the same root lock as mutations. */
export const reconcileCredentialStatus = async (
    rootId: string,
    transaction: Transaction
): Promise<void> => {
    const result = await transaction.run(
        `MATCH (root:Credential {id: $rootId})
         SET root._statusMutationLock = true REMOVE root._statusMutationLock
         WITH root
         OPTIONAL MATCH (issuer:Profile)-[sent:CREDENTIAL_SENT]->(root)
         OPTIONAL MATCH (refresh:CredentialRefresh)-[:ROOT]->(root)
         RETURN coalesce(refresh.issuerProfileId, root.statusOwnerProfileId, issuer.profileId) AS owner,
                sent.status AS status, refresh.state AS state`,
        { rootId }
    );
    const row = result.records[0];
    if (!row)
        throw new TRPCError({ code: 'CONFLICT', message: 'Credential has no original delivery' });
    const entries = await getStatusEntriesForCredential(rootId, transaction);
    for (const entry of [...entries].sort((a, b) =>
        a.statusListCredential.localeCompare(b.statusListCredential)
    )) {
        const value =
            entry.statusPurpose === 'revocation'
                ? row.get('status') === 'revoked' || row.get('state') === 'revoked'
                : row.get('status') === 'suspended';
        if (!(await setStatusListEntryBit(entry, value, String(row.get('owner')), transaction))) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Public credential status could not be updated; retry the operation',
            });
        }
    }
};
