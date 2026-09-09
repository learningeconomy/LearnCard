import { BindParam, QueryBuilder, QueryRunner } from 'neogma';

import type { InboxCredentialType } from '@learncard/types';
import { InboxCredential } from '@models';
import { encryptInboxCredential, INBOX_JWE_PREFIX } from '@helpers/inbox-encryption.helpers';
import { expireInboxCredentials } from '@accesslayer/inbox-credential/update';
import { deleteExpiredInboxCredentials } from '@accesslayer/inbox-credential/delete';
import { parseCredentialMeta } from '@helpers/credential-meta.helpers';

const MIGRATION_BATCH_SIZE = 100;

/** Migrates one bounded batch of legacy plaintext payloads and wipes non-pending legacy data. */
export const migrateLegacyInboxCredentials = async (
    limit = MIGRATION_BATCH_SIZE
): Promise<{ encrypted: number; wiped: number; scanned: number }> => {
    const result = await new QueryBuilder(new BindParam({ encryptedPrefix: INBOX_JWE_PREFIX }))
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where(
            'inboxCredential.credential IS NOT NULL AND (inboxCredential.currentStatus <> "PENDING" OR NOT inboxCredential.credential STARTS WITH $encryptedPrefix)'
        )
        .return('inboxCredential')
        .limit(limit)
        .run();

    const records =
        QueryRunner.getResultProperties<InboxCredentialType>(result, 'inboxCredential') ?? [];
    let encrypted = 0;
    let wiped = 0;

    for (const record of records) {
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
            // Serialize with finalization, then recheck the value read before encryption.
            // A completed claim must never have its payload restored by migration.
            .set('inboxCredential._escrowLock = true')
            .remove('inboxCredential._escrowLock')
            .with('inboxCredential')
            .where(
                'inboxCredential.currentStatus = "PENDING" AND inboxCredential.credential = $previousCredential'
            )
            .set(
                'inboxCredential.credential = $credential, inboxCredential.credentialName = $credentialName, inboxCredential.achievementType = $achievementType'
            )
            .return('inboxCredential.id')
            .run();
        encrypted += encryptedResult.records.length;
    }

    return { encrypted, wiped, scanned: records.length };
};

export const runInboxMaintenance = async (): Promise<{
    migrated: number;
    wiped: number;
    expired: number;
    deleted: number;
}> => {
    let migrated = 0;
    let wiped = 0;

    // Retention must still run if encryption is unavailable during a key/configuration outage.
    const expired = await expireInboxCredentials();
    const deleted = await deleteExpiredInboxCredentials();

    while (true) {
        const migration = await migrateLegacyInboxCredentials();
        migrated += migration.encrypted;
        wiped += migration.wiped;
        if (migration.scanned < MIGRATION_BATCH_SIZE) break;
    }

    return { migrated, wiped, expired, deleted };
};
