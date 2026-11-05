import { TRPCError } from '@trpc/server';
import type { Transaction } from 'neo4j-driver';
import { BitstringStatusListEntryValidator, type BitstringStatusListEntry } from '@learncard/types';
import { getBitstringStatusListEntries } from '@learncard/helpers';

import { neogma } from '@instance';
import { allocateStatusListEntry, validateStatusEntries } from './status-list.helpers';
import { getCredentialRefresh } from '@accesslayer/credential-refresh';
import { reconcileCredentialStatus } from './credential-status-mutation.helpers';

export const prepareRefreshStatusEntries = async (
    refreshId: string,
    ownerProfileId: string,
    domain: string,
    purposes: ('revocation' | 'suspension')[] = []
): Promise<BitstringStatusListEntry[]> => {
    const refresh = await getCredentialRefresh(refreshId);
    if (refresh?.statusEntries)
        return BitstringStatusListEntryValidator.array().parse(JSON.parse(refresh.statusEntries));
    const entries = await Promise.all(
        [...new Set(['revocation' as const, ...purposes])].map(purpose =>
            allocateStatusListEntry(ownerProfileId, domain, purpose)
        )
    );
    await bindRefreshStatusEntries(refreshId, entries, ownerProfileId, domain);
    return entries;
};

const coordinates = (entries: BitstringStatusListEntry[]): string =>
    JSON.stringify(
        entries
            .map(entry => [entry.statusListCredential, entry.statusListIndex, entry.statusPurpose])
            .sort()
    );

/** Bind public coordinates under list locks; an index can belong to only one refresh. */
export const bindRefreshStatusEntries = async (
    refreshId: string,
    entries: BitstringStatusListEntry[],
    ownerProfileId: string,
    domain: string,
    transaction?: Transaction
): Promise<void> => {
    await validateStatusEntries(entries, ownerProfileId, domain);
    await neogma.getTransaction(transaction ?? null, async tx => {
        const result = await tx.run(
            `MATCH (refresh:CredentialRefresh {refreshId: $refreshId, issuerProfileId: $ownerProfileId})
             OPTIONAL MATCH (refresh)-[:ROOT]->(root:Credential)
             FOREACH (_ IN CASE WHEN root IS NULL THEN [] ELSE [1] END |
                 SET root._statusMutationLock = true REMOVE root._statusMutationLock)
             SET refresh._statusBindingLock = true
             REMOVE refresh._statusBindingLock
             RETURN refresh.statusEntries AS entries, root.id AS rootId`,
            { refreshId, ownerProfileId }
        );
        const row = result.records[0];
        if (!row)
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential refresh not found' });
        const stored: unknown = row.get('entries');
        if (
            typeof stored === 'string' &&
            coordinates(BitstringStatusListEntryValidator.array().parse(JSON.parse(stored))) !==
                coordinates(entries)
        ) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Credential status does not match allocated entries',
            });
        }
        // A stable order prevents deadlocks when a credential has multiple lists.
        for (const entry of [...entries].sort((a, b) =>
            a.statusListCredential.localeCompare(b.statusListCredential)
        )) {
            const binding = await tx.run(
                `MATCH (list:BitstringStatusList {statusListCredential: $url})
                 SET list._statusBindingLock = true
                 REMOVE list._statusBindingLock
                 WITH list
                 OPTIONAL MATCH (list)-[:HAS_STATUS_BINDING]->(binding:CredentialStatusBinding {index: $index})
                 RETURN binding.refreshId AS refreshId, binding.credentialId AS credentialId`,
                { url: entry.statusListCredential, index: String(entry.statusListIndex) }
            );
            const bound: unknown = binding.records[0]?.get('refreshId');
            if ((bound && bound !== refreshId) || binding.records[0]?.get('credentialId')) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Status list index is already bound to another credential',
                });
            }
            // Legacy ordinary deliveries predate index bindings. Do not let a repair
            // or low-level managed send take over one of their signed coordinates.
            const legacy = await tx.run(
                `MATCH (:Profile {profileId: $ownerProfileId})-[:CREDENTIAL_SENT]->(credential:Credential)
                 WHERE coalesce(credential.refreshId, '') <> $refreshId
                   AND (credential.statusEntries CONTAINS $url OR credential.credential CONTAINS $url)
                 RETURN credential.statusEntries AS entries, credential.credential AS body`,
                { ownerProfileId, refreshId, url: entry.statusListCredential }
            );
            for (const row of legacy.records) {
                const rawEntries: unknown = row.get('entries');
                const body: unknown = row.get('body');
                const existing: BitstringStatusListEntry[] =
                    typeof rawEntries === 'string'
                        ? BitstringStatusListEntryValidator.array().parse(JSON.parse(rawEntries))
                        : typeof body === 'string'
                          ? getBitstringStatusListEntries(JSON.parse(body))
                          : [];
                if (
                    existing.some(
                        candidate =>
                            candidate.statusListCredential === entry.statusListCredential &&
                            Number(candidate.statusListIndex) === Number(entry.statusListIndex)
                    )
                ) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Status list index is already bound to another credential',
                    });
                }
            }
            await tx.run(
                `MATCH (list:BitstringStatusList {statusListCredential: $url})
                 MERGE (list)-[:HAS_STATUS_BINDING]->(binding:CredentialStatusBinding {index: $index})
                 SET binding.refreshId = $refreshId`,
                { url: entry.statusListCredential, index: String(entry.statusListIndex), refreshId }
            );
        }
        await tx.run(
            `MATCH (refresh:CredentialRefresh {refreshId: $refreshId}) SET refresh.statusEntries = $entries`,
            { refreshId, entries: JSON.stringify(entries) }
        );
        const rootId: unknown = row.get('rootId');
        if (typeof rootId === 'string') await reconcileCredentialStatus(rootId, tx);
    });
};
