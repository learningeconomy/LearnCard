import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { CredentialMetadata, LCR } from 'learn-card-base/types/credential-records';
import { getCategoryForCredential } from 'learn-card-base/hooks/useWallet';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

export type ExistingCredentialMatch = {
    credential: VC;
    record: LCR;
};
export type DuplicateCredentialLookup = {
    boostUri?: string;
};

const resolveMatchingRecord = async (
    wallet: BespokeLearnCard,
    records: LCR[],
    credentialId: string,
    boostUri: string,
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
        if (result.status !== 'fulfilled') continue;

        const resolvedCredential = result.value.credential;
        const unwrappedCredential = unwrapBoostCredential(resolvedCredential);
        const resolvedCredentialId = unwrappedCredential?.id;
        const resolvedBoostUri = resolvedCredential?.boostId ?? unwrappedCredential?.boostId;
        const matchesCredentialId = Boolean(credentialId && resolvedCredentialId === credentialId);
        const matchesBoostUri = Boolean(
            boostUri && (result.value.record.boostUri === boostUri || resolvedBoostUri === boostUri)
        );

        if (matchesCredentialId || matchesBoostUri) return result.value;
    }

    return null;
};

/**
 * Finds an already-saved credential with the same stable credential ID or source Boost URI.
 *
 * Older claim flows generated a random wallet-index record ID, so exact index lookups are only
 * fast paths. The category scan preserves duplicate detection for those existing records. Claim
 * links also issue a new credential ID on each request, so their stable Boost URI is used when
 * available.
 */
export const findDuplicateCredential = async (
    wallet: BespokeLearnCard,
    credential: VC,
    lookup: DuplicateCredentialLookup = {}
): Promise<ExistingCredentialMatch | null> => {
    const unwrappedCredential = unwrapBoostCredential(credential);
    const unwrappedCredentialId = unwrappedCredential?.id;
    const credentialId =
        typeof unwrappedCredentialId === 'string' ? unwrappedCredentialId.trim() : '';
    const credentialBoostUri = credential?.boostId ?? unwrappedCredential?.boostId;
    const boostUri =
        typeof (lookup.boostUri ?? credentialBoostUri) === 'string'
            ? (lookup.boostUri ?? credentialBoostUri)?.trim() ?? ''
            : '';
    if (!credentialId && !boostUri) return null;

    const seenUris = new Set<string>();

    if (credentialId) {
        const exactRecords = ((await wallet.index.LearnCloud.get<CredentialMetadata>({
            id: credentialId,
        })) ?? []) as LCR[];
        const exactMatch = await resolveMatchingRecord(
            wallet,
            exactRecords,
            credentialId,
            boostUri,
            seenUris
        );
        if (exactMatch) return exactMatch;
    }

    if (boostUri) {
        const boostRecords = ((await wallet.index.LearnCloud.get<CredentialMetadata>({
            boostUri,
        })) ?? []) as LCR[];
        const boostMatch = await resolveMatchingRecord(
            wallet,
            boostRecords,
            credentialId,
            boostUri,
            seenUris
        );
        if (boostMatch) return boostMatch;
    }

    const category = await getCategoryForCredential(credential, wallet);
    const getPage = wallet.index.LearnCloud.getPage;

    if (!getPage) {
        const categoryRecords = ((await wallet.index.LearnCloud.get<CredentialMetadata>({
            category,
        })) ?? []) as LCR[];
        return resolveMatchingRecord(wallet, categoryRecords, credentialId, boostUri, seenUris);
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
            boostUri,
            seenUris
        );
        if (match) return match;

        if (!page?.hasMore || !page.cursor || seenCursors.has(page.cursor)) break;

        seenCursors.add(page.cursor);
        cursor = page.cursor;
    }

    return null;
};
