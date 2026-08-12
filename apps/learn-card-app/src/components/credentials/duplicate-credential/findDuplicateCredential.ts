import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { CredentialMetadata, LCR } from 'learn-card-base/types/credential-records';
import { getCategoryForCredential } from 'learn-card-base/hooks/useWallet';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { stringify } from 'learn-card-base/helpers/jsonHelpers';

export type ExistingCredentialMatch = {
    credential: VC;
    record: LCR;
};
export type DuplicateCredentialLookup = {
    boostUri?: string;
    compareByContent?: boolean;
};
const getCredentialContentKey = (credential: VC): string => {
    const unwrappedCredential = unwrapBoostCredential(credential) ?? credential;
    const {
        id: _id,
        proof: _proof,
        validFrom: _validFrom,
        issuanceDate: _issuanceDate,
        credentialStatus: _credentialStatus,
        boostId: _boostId,
        credentialSubject,
        ...stableCredential
    } = unwrappedCredential as VC & Record<string, unknown>;

    const withoutSubjectId = (subject: unknown): unknown => {
        if (!subject || typeof subject !== 'object') return subject;
        const { id: _subjectId, ...stableSubject } = subject as Record<string, unknown>;
        return stableSubject;
    };

    return stringify({
        ...stableCredential,
        credentialSubject: Array.isArray(credentialSubject)
            ? credentialSubject.map(withoutSubjectId)
            : withoutSubjectId(credentialSubject),
    });
};

type ResolveCredential = (uri: string) => Promise<VC | undefined>;
const MAX_CATEGORY_PAGES = 1000;
export class DuplicateCredentialScanLimitError extends Error {
    public constructor(maxPages: number) {
        super(`Duplicate credential scan exceeded ${maxPages} pages`);
        this.name = 'DuplicateCredentialScanLimitError';
    }
}

const resolveMatchingRecord = async (
    records: LCR[],
    incomingCredential: VC,
    credentialId: string,
    boostUri: string,
    credentialContentKey: string,
    seenUris: Set<string>,
    resolveCredential: ResolveCredential
): Promise<ExistingCredentialMatch | null> => {
    const indexMatch = records.find(
        record =>
            (credentialId && record.id === credentialId) ||
            (boostUri && record.boostUri === boostUri)
    );
    if (indexMatch) return { credential: incomingCredential, record: indexMatch };

    if (!credentialContentKey) return null;

    const unreadRecords = records.filter(record => record.uri && !seenUris.has(record.uri));
    unreadRecords.forEach(record => seenUris.add(record.uri));

    const resolved = await Promise.allSettled(
        unreadRecords.map(async record => ({
            record,
            credential: await resolveCredential(record.uri),
        }))
    );

    for (const result of resolved) {
        if (result.status !== 'fulfilled' || !result.value.credential) continue;

        if (getCredentialContentKey(result.value.credential) === credentialContentKey) {
            return {
                record: result.value.record,
                credential: result.value.credential,
            };
        }
    }

    return null;
};

/**
 * Finds an already-saved credential by index metadata or, when explicitly requested, stable
 * credential contents.
 *
 * Exact credential-ID and source-Boost queries require no credential reads. Content comparison is
 * reserved for legacy records that predate those index fields; callers opt into that slower scan
 * with `compareByContent`.
 */
export const findDuplicateCredential = async (
    wallet: BespokeLearnCard,
    credential: VC,
    lookup: DuplicateCredentialLookup = {},
    resolveCredential: ResolveCredential = async uri =>
        (await wallet.read.get(uri)) as VC | undefined
): Promise<ExistingCredentialMatch | null> => {
    const unwrappedCredential = unwrapBoostCredential(credential) ?? credential;
    const credentialId =
        typeof unwrappedCredential.id === 'string' ? unwrappedCredential.id.trim() : '';
    const credentialBoostUri = credential?.boostId ?? unwrappedCredential?.boostId;
    const rawBoostUri = lookup.boostUri ?? credentialBoostUri;
    const boostUri = typeof rawBoostUri === 'string' ? rawBoostUri.trim() : '';
    const credentialContentKey = lookup.compareByContent ? getCredentialContentKey(credential) : '';

    if (!credentialId && !boostUri && !credentialContentKey) return null;

    if (credentialId) {
        const exactRecords = ((await wallet.index.LearnCloud.get<CredentialMetadata>({
            id: credentialId,
        })) ?? []) as LCR[];
        const exactMatch = exactRecords[0];
        if (exactMatch) return { credential, record: exactMatch };
    }

    if (boostUri) {
        const boostRecords = ((await wallet.index.LearnCloud.get<CredentialMetadata>({
            boostUri,
        })) ?? []) as LCR[];
        const boostMatch = boostRecords[0];
        if (boostMatch) return { credential, record: boostMatch };
    }

    if (!credentialContentKey) return null;

    const seenUris = new Set<string>();
    const category = await getCategoryForCredential(credential, wallet);
    const getPage = wallet.index.LearnCloud.getPage;

    if (!getPage) {
        const categoryRecords = ((await wallet.index.LearnCloud.get<CredentialMetadata>({
            category,
        })) ?? []) as LCR[];
        return resolveMatchingRecord(
            categoryRecords,
            credential,
            credentialId,
            boostUri,
            credentialContentKey,
            seenUris,
            resolveCredential
        );
    }

    let cursor: string | undefined;
    let pageCount = 0;
    const seenCursors = new Set<string>();

    while (pageCount < MAX_CATEGORY_PAGES) {
        pageCount += 1;
        // Sequential pages avoid loading the user's entire wallet into memory at once.
        // eslint-disable-next-line no-await-in-loop
        const page = await getPage<CredentialMetadata>({ category }, { cursor, limit: 50 });

        // eslint-disable-next-line no-await-in-loop
        const match = await resolveMatchingRecord(
            (page?.records ?? []) as LCR[],
            credential,
            credentialId,
            boostUri,
            credentialContentKey,
            seenUris,
            resolveCredential
        );
        if (match) return match;

        if (!page?.hasMore || !page.cursor || seenCursors.has(page.cursor)) return null;

        seenCursors.add(page.cursor);
        cursor = page.cursor;
    }

    throw new DuplicateCredentialScanLimitError(MAX_CATEGORY_PAGES);
};
