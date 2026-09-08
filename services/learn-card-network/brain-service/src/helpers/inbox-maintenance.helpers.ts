import { BindParam, QueryBuilder, QueryRunner } from 'neogma';

import type { InboxCredentialType } from '@learncard/types';
import { InboxCredential } from '@models';
import {
    encryptInboxCredential,
    isEncryptedInboxCredential,
} from '@helpers/inbox-encryption.helpers';
import { expireInboxCredentials } from '@accesslayer/inbox-credential/update';
import { deleteExpiredInboxCredentials } from '@accesslayer/inbox-credential/delete';
import { parseCredentialMeta } from '@helpers/credential-meta.helpers';

const MIGRATION_BATCH_SIZE = 100;

/** Migrates one bounded batch of legacy plaintext payloads and wipes non-pending legacy data. */
export const migrateLegacyInboxCredentials = async (
    limit = MIGRATION_BATCH_SIZE
): Promise<{ encrypted: number; wiped: number }> => {
    const result = await new QueryBuilder(new BindParam({ encryptedPrefix: 'lc-inbox-jwe:v1:' }))
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where(
            'inboxCredential.credential IS NOT NULL AND NOT inboxCredential.credential STARTS WITH $encryptedPrefix'
        )
        .return('inboxCredential')
        .limit(limit)
        .run();

    const records =
        QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential') ?? [];
    let encrypted = 0;
    let wiped = 0;

    for (const record of records) {
        if (!record.credential || isEncryptedInboxCredential(record.credential)) continue;

        if (record.currentStatus !== 'PENDING') {
            await new QueryBuilder(new BindParam({ id: record.id }))
                .match({ model: InboxCredential, identifier: 'inboxCredential' })
                .where('inboxCredential.id = $id')
                .set('inboxCredential.credential = null')
                .run();
            wiped += 1;
            continue;
        }

        const credential = await encryptInboxCredential(record.credential);
        const credentialMeta = parseCredentialMeta(record.credential);
        await new QueryBuilder(
            new BindParam({
                id: record.id,
                credential,
                credentialName: credentialMeta.credentialName ?? null,
                achievementType: credentialMeta.achievementType ?? null,
            })
        )
            .match({ model: InboxCredential, identifier: 'inboxCredential' })
            .where('inboxCredential.id = $id')
            .set(
                'inboxCredential.credential = $credential, inboxCredential.credentialName = $credentialName, inboxCredential.achievementType = $achievementType'
            )
            .run();
        encrypted += 1;
    }

    return { encrypted, wiped };
};

export const runInboxMaintenance = async (): Promise<{
    migrated: number;
    wiped: number;
    expired: number;
    deleted: number;
}> => {
    let migrated = 0;
    let wiped = 0;
    let processed = 0;

    do {
        const migration = await migrateLegacyInboxCredentials();
        migrated += migration.encrypted;
        wiped += migration.wiped;
        processed = migration.encrypted + migration.wiped;
    } while (processed === MIGRATION_BATCH_SIZE);

    const expired = await expireInboxCredentials();
    const deleted = await deleteExpiredInboxCredentials();

    return { migrated, wiped, expired, deleted };
};
