import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { CredentialMetadata, LCR } from 'learn-card-base/types/credential-records';
import { getCategoryForCredential } from 'learn-card-base/hooks/useWallet';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

export type ExistingCredentialMatch = {
    credential: VC;
    record: LCR;
};

const resolveMatchingRecord = async (
    wallet: BespokeLearnCard,
    records: LCR[],
    credentialId: string,
    seenUris: Set<string>
): Promise<ExistingCredentialMatch | null> => {
    const unreadRecords = records.filter(record => record.uri && !seenUris.has(record.uri));
    unreadRecords.forEach(record => seenUris.add(record.uri));

    const resolved = await Promise.allSettled(
        unreadRecords.map(async record => ({
            record,
            credential: (await wallet.read.get(record.uri)) as VC,
        }))
    );

    for (const result of resolved) {
        const resolvedCredential =
            result.status === 'fulfilled' ? result.value.credential : undefined;
        const resolvedCredentialId = unwrapBoostCredential(resolvedCredential)?.id;

        if (resolvedCredentialId === credentialId && result.status === 'fulfilled') {
            return result.value;
        }
    }

    return null;
};

/**
 * Finds an already-saved credential with the same stable credential ID.
 *
 * Older claim flows generated a random wallet-index record ID, so an exact index lookup is only
 * the fast path. The category scan preserves duplicate detection for those existing records.
 */
export const findDuplicateCredential = async (
    wallet: BespokeLearnCard,
    credential: VC
): Promise<ExistingCredentialMatch | null> => {
    const unwrappedCredentialId = unwrapBoostCredential(credential)?.id;
    const credentialId =
        typeof unwrappedCredentialId === 'string' ? unwrappedCredentialId.trim() : '';
    if (!credentialId) return null;

    const seenUris = new Set<string>();
    const exactRecords = ((await wallet.index.LearnCloud.get<CredentialMetadata>({
        id: credentialId,
    })) ?? []) as LCR[];
    const exactMatch = await resolveMatchingRecord(wallet, exactRecords, credentialId, seenUris);
    if (exactMatch) return exactMatch;

    const category = await getCategoryForCredential(credential, wallet);
    const getPage = wallet.index.LearnCloud.getPage;

    if (!getPage) {
        const categoryRecords = ((await wallet.index.LearnCloud.get<CredentialMetadata>({
            category,
        })) ?? []) as LCR[];
        return resolveMatchingRecord(wallet, categoryRecords, credentialId, seenUris);
    }

    let cursor: string | undefined;
    let pageCount = 0;
    const seenCursors = new Set<string>();

    while (pageCount < 1000) {
        // Sequential pages avoid loading the user's entire wallet into memory at once.
        // eslint-disable-next-line no-await-in-loop
        const page = await getPage<CredentialMetadata>({ category }, { cursor, limit: 50 });
        pageCount += 1;

        // eslint-disable-next-line no-await-in-loop
        const match = await resolveMatchingRecord(
            wallet,
            (page?.records ?? []) as LCR[],
            credentialId,
            seenUris
        );
        if (match) return match;

        if (!page?.hasMore || !page.cursor || seenCursors.has(page.cursor)) break;

        seenCursors.add(page.cursor);
        cursor = page.cursor;
    }

    return null;
};
