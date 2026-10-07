import { BindParam, QueryBuilder, QueryRunner } from 'neogma';

import { environment } from '@environment';
import type { InboxCredentialType } from '@learncard/types';
import { InboxCredential } from '@models';
import { encryptInboxCredential, INBOX_JWE_PREFIX } from '@helpers/inbox-encryption.helpers';
import {
    expireInboxCredentials,
    wipeExpiredInboxDeliveries,
} from '@accesslayer/inbox-credential/update';
import { deleteExpiredInboxCredentials } from '@accesslayer/inbox-credential/delete';
import { parseCredentialMeta } from '@helpers/credential-meta.helpers';

const MIGRATION_BATCH_SIZE = 100;
const MAX_BATCHES_PER_RUN = 10;

/** Migrates one bounded batch of legacy plaintext payloads and wipes non-pending legacy data. */
export const migrateLegacyInboxCredentials = async (
    limit = MIGRATION_BATCH_SIZE
): Promise<{ encrypted: number; wiped: number; scanned: number; failed: number }> => {
    const result = await new QueryBuilder(new BindParam({ encryptedPrefix: INBOX_JWE_PREFIX }))
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where(
            'inboxCredential.credential IS NOT NULL AND (inboxCredential.currentStatus <> "PENDING" OR NOT inboxCredential.credential STARTS WITH $encryptedPrefix)'
        )
        .return('inboxCredential')
        .orderBy('coalesce(inboxCredential.migrationAttemptedAt, ""), inboxCredential.id')
        .limit(limit)
        .run();

    const records =
        QueryRunner.getResultProperties<InboxCredentialType>(result, 'inboxCredential') ?? [];
    let encrypted = 0;
    let wiped = 0;
    let failed = 0;

    for (const record of records) {
        try {
            if (record.credential === undefined) continue;

            if (record.currentStatus !== 'PENDING') {
                const wipedResult = await new QueryBuilder(new BindParam({ id: record.id }))
                    .match({ model: InboxCredential, identifier: 'inboxCredential' })
                    .where('inboxCredential.id = $id')
                    .set('inboxCredential._escrowLock = true')
                    .remove('inboxCredential._escrowLock')
                    .with('inboxCredential')
                    .where('inboxCredential.currentStatus <> "PENDING"')
                    .set(
                        'inboxCredential.credential = null, inboxCredential.credentialName = null, inboxCredential.achievementType = null'
                    )
                    .return('inboxCredential.id')
                    .run();
                wiped += wipedResult.records.length;
                continue;
            }

            const credential = await encryptInboxCredential(record.credential);
            const credentialMeta = parseCredentialMeta(record.credential);
            const encryptedResult = await new QueryBuilder(
                new BindParam({
                    id: record.id,
                    previousCredential: record.credential,
                    credential,
                    credentialName: credentialMeta.credentialName ?? null,
                    achievementType: credentialMeta.achievementType ?? null,
                })
            )
                .match({ model: InboxCredential, identifier: 'inboxCredential' })
                .where('inboxCredential.id = $id')
                // Lock the node before the compare-and-swap. Neo4j holds this write lock until
                // commit even though the temporary property is removed in this transaction.
                .set('inboxCredential._escrowLock = true')
                .remove('inboxCredential._escrowLock')
                .with('inboxCredential')
                // Compare-and-swap against the payload read before encryption. A completed claim
                // changes status and clears the payload, so migration cannot restore escrow data.
                .where(
                    'inboxCredential.currentStatus = "PENDING" AND inboxCredential.credential = $previousCredential'
                )
                .set(
                    'inboxCredential.credential = $credential, inboxCredential.credentialName = $credentialName, inboxCredential.achievementType = $achievementType'
                )
                .return('inboxCredential.id')
                .run();
            encrypted += encryptedResult.records.length;
        } catch {
            failed += 1;
            // Do not log plaintext or crypto errors containing credential contents. Move a
            // poison record behind untouched records so it cannot monopolize later runs.
            console.error('Failed to migrate inbox credential', record.id);
            await new QueryBuilder(
                new BindParam({ id: record.id, attemptedAt: new Date().toISOString() })
            )
                .match({ model: InboxCredential, identifier: 'ic' })
                .where('ic.id = $id')
                .set('ic.migrationAttemptedAt = $attemptedAt')
                .run()
                .catch(() => console.error('Failed to record inbox migration attempt', record.id));
        }
    }

    return { encrypted, wiped, scanned: records.length, failed };
};

/** Bound both transaction size and total work per invocation. */
const runBatches = async (operation: () => Promise<number>): Promise<number> => {
    let total = 0;
    for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch += 1) {
        const count = await operation();
        total += count;
        if (count < MIGRATION_BATCH_SIZE) break;
    }
    return total;
};

export const runInboxMaintenance = async ({
    deleteExpiredRecords = environment.INBOX_DELETE_EXPIRED_RECORDS,
}: { deleteExpiredRecords?: boolean } = {}): Promise<{
    migrated: number;
    wiped: number;
    failed: number;
    expired: number;
    deleted: number;
    deliveriesWiped: number;
}> => {
    let migrated = 0;
    let wiped = 0;
    let failed = 0;

    // Payload removal remains enabled during key outages. Audit deletion is opt-in
    // so operators can count and review the historical backlog before enabling it.
    const expired = await runBatches(() => expireInboxCredentials());
    const deliveriesWiped = await runBatches(() => wipeExpiredInboxDeliveries());
    const deleted = deleteExpiredRecords
        ? await runBatches(() => deleteExpiredInboxCredentials())
        : 0;

    for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch += 1) {
        const migration = await migrateLegacyInboxCredentials();
        migrated += migration.encrypted;
        wiped += migration.wiped;
        failed += migration.failed;
        if (migration.scanned < MIGRATION_BATCH_SIZE) break;
    }

    return { migrated, wiped, failed, expired, deleted, deliveriesWiped };
};
