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
const MAX_CATEGORY_PAGES = 20;
const DUPLICATE_SCAN_TIME_BUDGET_MS = 3000;

export class DuplicateCredentialScanSafetyError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'DuplicateCredentialScanSafetyError';
    }
}

const runWithinDuplicateScanBudget = async <T>(
    operation: () => Promise<T>,
    deadline: number
): Promise<T> => {
    const remainingMs = deadline - Date.now();

    if (remainingMs <= 0) {
        throw new DuplicateCredentialScanSafetyError(
            `Duplicate credential scan exceeded ${DUPLICATE_SCAN_TIME_BUDGET_MS}ms`
        );
    }

    const { promise: timeout, reject } = Promise.withResolvers<never>();
    const timeoutId = setTimeout(() => {
        reject(
            new DuplicateCredentialScanSafetyError(
                `Duplicate credential scan exceeded ${DUPLICATE_SCAN_TIME_BUDGET_MS}ms`
            )
        );
    }, remainingMs);

    try {
        return await Promise.race([operation(), timeout]);
    } finally {
        clearTimeout(timeoutId);
    }
};

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
 *
 * Every lookup shares a three-second deadline. Legacy content scans also stop after 20 pages so
 * duplicate detection cannot leave the primary claim flow waiting on an unusually large wallet.
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
    const scanDeadline = Date.now() + DUPLICATE_SCAN_TIME_BUDGET_MS;

    if (credentialId) {
        const exactRecords = ((await runWithinDuplicateScanBudget(
            () => wallet.index.LearnCloud.get<CredentialMetadata>({ id: credentialId }),
            scanDeadline
        )) ?? []) as LCR[];
        const exactMatch = exactRecords[0];
        if (exactMatch) return { credential, record: exactMatch };
    }

    if (boostUri) {
        const boostRecords = ((await runWithinDuplicateScanBudget(
            () => wallet.index.LearnCloud.get<CredentialMetadata>({ boostUri }),
            scanDeadline
        )) ?? []) as LCR[];
        const boostMatch = boostRecords[0];
        if (boostMatch) return { credential, record: boostMatch };
    }

    if (!credentialContentKey) return null;

    const seenUris = new Set<string>();
    const category = await runWithinDuplicateScanBudget(
        () => getCategoryForCredential(credential, wallet),
        scanDeadline
    );
    const getPage = wallet.index.LearnCloud.getPage;

    if (!getPage) {
        const categoryRecords = ((await runWithinDuplicateScanBudget(
            () => wallet.index.LearnCloud.get<CredentialMetadata>({ category }),
            scanDeadline
        )) ?? []) as LCR[];
        return runWithinDuplicateScanBudget(
            () =>
                resolveMatchingRecord(
                    categoryRecords,
                    credential,
                    credentialId,
                    boostUri,
                    credentialContentKey,
                    seenUris,
                    resolveCredential
                ),
            scanDeadline
        );
    }

    let cursor: string | undefined;
    let pageCount = 0;
    const seenCursors = new Set<string>();

    while (pageCount < MAX_CATEGORY_PAGES) {
        pageCount += 1;
        // Sequential pages avoid loading the user's entire wallet into memory at once.
        // eslint-disable-next-line no-await-in-loop
        const page = await runWithinDuplicateScanBudget(
            () => getPage<CredentialMetadata>({ category }, { cursor, limit: 50 }),
            scanDeadline
        );

        // eslint-disable-next-line no-await-in-loop
        const match = await runWithinDuplicateScanBudget(
            () =>
                resolveMatchingRecord(
                    (page?.records ?? []) as LCR[],
                    credential,
                    credentialId,
                    boostUri,
                    credentialContentKey,
                    seenUris,
                    resolveCredential
                ),
            scanDeadline
        );
        if (match) return match;

        if (!page?.hasMore) return null;
        if (!page.cursor || seenCursors.has(page.cursor)) {
            throw new DuplicateCredentialScanSafetyError(
                'Duplicate credential scan received an invalid pagination cursor'
            );
        }

        seenCursors.add(page.cursor);
        cursor = page.cursor;
    }

    throw new DuplicateCredentialScanSafetyError(
        `Duplicate credential scan exceeded ${MAX_CATEGORY_PAGES} pages`
    );
};
