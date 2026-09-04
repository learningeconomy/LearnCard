import type { CredentialRefreshFailureCode, CredentialRefreshResult, VC } from '@learncard/types';
import { getSupportedRefreshService } from '@learncard/helpers';

import { getLogger } from '../logging/logger';
import { newCredsStore } from '../stores/newCredsStore';
import type { BespokeLearnCard } from '../types/learn-card';
import { CredentialRefreshMetadata, LCR } from '../types/credential-records';

const log = getLogger('credential-refresh');

/**
 * In-place LearnCloud credential replacement with rollback safety (LC-2117, LC-2135,
 * LC-2136).
 *
 * `refreshLearnCloudCredential` coordinates the generic `refreshCredential` primitive
 * with the holder's encrypted LearnCloud index. For an `updated` candidate it:
 *
 * 1. Re-reads the current index record (the input record may be stale).
 * 2. Resolves the current credential and calls the refresh primitive.
 * 3. Uploads the verified candidate through `store.LearnCloud.uploadEncrypted`.
 * 4. Re-reads the index record before committing and stops when another device or
 *    process has already advanced the record (superseded).
 * 5. Updates the same index record in one call: new current URI, old URI appended
 *    once to encrypted local history, ETag/version/check timestamps, unread flag.
 *
 * On any failure before the index update, the old record remains authoritative and
 * only the new, still-unindexed upload is deleted on a best-effort basis. A URI
 * referenced by history is never deleted. The old encrypted payload is intentionally
 * retained for holder history.
 *
 * Concurrent calls for the same index record are coalesced through a per-record
 * in-flight mutex: the second caller receives the same promise.
 */

/** Ordinary per-credential check throttle; forced checks bypass it */
export const CREDENTIAL_REFRESH_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Helper-layer failure codes plus the primitive's safe failure codes */
export type LearnCloudCredentialRefreshFailureCode =
    | CredentialRefreshFailureCode
    | 'RECORD_MISSING'
    | 'READ_FAILED'
    | 'UNRESOLVABLE_CREDENTIAL'
    | 'UPLOAD_FAILED'
    | 'INDEX_UPDATE_FAILED'
    | 'UNEXPECTED';

export type LearnCloudCredentialRefreshResult =
    | { status: 'updated'; record: LCR; uri: string; previousUri: string }
    | { status: 'unchanged'; record: LCR }
    | { status: 'skipped'; reason: 'recently-checked'; record: LCR }
    | { status: 'superseded'; record: LCR }
    | { status: 'unsupported' }
    | {
          status: 'failed';
          code: LearnCloudCredentialRefreshFailureCode;
          retryable: boolean;
          error?: unknown;
      };

export type RefreshLearnCloudCredentialParams = {
    wallet: BespokeLearnCard;
    /** The LearnCloud index record to refresh; re-read before use and before commit */
    record: LCR;
    /** Bypass the staleness guard (detail views, notification taps) */
    force?: boolean;
};

const failed = (
    code: LearnCloudCredentialRefreshFailureCode,
    retryable: boolean,
    error?: unknown
): LearnCloudCredentialRefreshResult => ({ status: 'failed', code, retryable, error });

const inFlightRefreshes = new Map<string, Promise<LearnCloudCredentialRefreshResult>>();

const getInFlightRefreshKey = (wallet: BespokeLearnCard, recordId: string): string =>
    JSON.stringify([wallet.id.did(), recordId]);

const readRecord = async (wallet: BespokeLearnCard, id: string): Promise<LCR | undefined> => {
    const records = await wallet.index.LearnCloud.get({ id });

    return records?.[0] as LCR | undefined;
};

/**
 * Best-effort removal of a still-unindexed upload. Only ever invoked with the freshly
 * uploaded URI before the index references it — never with a URI referenced by an
 * index record or by refresh history.
 */
const bestEffortDeleteUpload = async (wallet: BespokeLearnCard, uri: string): Promise<void> => {
    try {
        await wallet.store.LearnCloud.delete?.(uri);
    } catch (error) {
        log.warn('refresh.cleanup.failed', error, { uri });
    }
};

/** Replaces the old URI with the new URI in `newCredsStore` so indicators follow the credential */
const followNewCredsIndicator = (record: LCR, previousUri: string, newUri: string): void => {
    try {
        const category = record.category;

        if (!category) return;

        const tracked = newCredsStore.get.state().newCreds[category] ?? [];

        if (tracked.includes(previousUri)) {
            newCredsStore.set.removeCreds([previousUri]);
            newCredsStore.set.addNewCreds({ [category]: [newUri] });
        }
    } catch (error) {
        log.error('refresh.newCredsStore.failed', error);
    }
};

const initialMetadataFor = (vc: VC): CredentialRefreshMetadata | undefined => {
    const service = getSupportedRefreshService(vc);

    if (!service || typeof vc.id !== 'string' || vc.id.length === 0) return undefined;

    return { serviceId: service.id, serviceType: service.type, credentialId: vc.id, history: [] };
};

const effectiveDateOf = (vc: VC): string | undefined => {
    const raw =
        (vc as { validFrom?: string; issuanceDate?: string }).validFrom ??
        (vc as { issuanceDate?: string }).issuanceDate;

    return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
};

const performRefresh = async (
    wallet: BespokeLearnCard,
    inputRecord: LCR,
    force: boolean
): Promise<LearnCloudCredentialRefreshResult> => {
    const now = new Date().toISOString();

    // 1. Re-read the current record; the caller's record may be stale.
    let current: LCR | undefined;

    try {
        current = await readRecord(wallet, inputRecord.id);
    } catch (error) {
        return failed('READ_FAILED', true, error);
    }

    if (!current) return failed('RECORD_MISSING', false);

    if (current.uri !== inputRecord.uri) return { status: 'superseded', record: current };

    const metadata = current.refresh;

    if (!force && metadata?.lastCheckedAt) {
        const lastChecked = Date.parse(metadata.lastCheckedAt);

        if (
            !Number.isNaN(lastChecked) &&
            Date.now() - lastChecked < CREDENTIAL_REFRESH_CHECK_INTERVAL_MS
        ) {
            return { status: 'skipped', reason: 'recently-checked', record: current };
        }
    }

    // 2. Resolve the current credential.
    let vc: VC | undefined;

    try {
        vc = (await wallet.read.get(current.uri)) as VC | undefined;
    } catch (error) {
        return failed('UNRESOLVABLE_CREDENTIAL', true, error);
    }

    if (!vc) return failed('UNRESOLVABLE_CREDENTIAL', true);

    // 3. Refresh and validate the candidate (no storage mutation inside the primitive).
    let result: CredentialRefreshResult;

    try {
        result = await wallet.invoke.refreshCredential(vc, { etag: metadata?.etag });
    } catch (error) {
        return failed('UNAVAILABLE', true, error);
    }

    if (result.status === 'unsupported') return { status: 'unsupported' };

    if (result.status === 'failed') {
        // Retain the current credential. `lastCheckedAt` is intentionally not bumped so
        // the next foreground scan can retry retryable failures.
        return failed(result.code, result.retryable);
    }

    const base: CredentialRefreshMetadata | undefined = metadata ?? initialMetadataFor(vc);

    if (result.status === 'unchanged') {
        if (!base) return { status: 'unchanged', record: current };

        const nextMetadata: CredentialRefreshMetadata = {
            ...base,
            ...(result.etag ? { etag: result.etag } : {}),
            lastCheckedAt: now,
        };

        try {
            await wallet.index.LearnCloud.update(current.id, { refresh: nextMetadata });
        } catch (error) {
            // Check-metadata persistence is best-effort; the credential itself is unchanged.
            log.warn('refresh.unchanged.metadata.failed', error);
        }

        return { status: 'unchanged', record: { ...current, refresh: nextMetadata } };
    }

    // result.status === 'updated'
    if (!base) return failed('UNRESOLVABLE_CREDENTIAL', false);

    // 4. Upload the verified candidate, encrypted to the holder.
    let newUri: string | undefined;

    try {
        newUri = await wallet.store.LearnCloud.uploadEncrypted?.(result.credential);
    } catch (error) {
        return failed('UPLOAD_FAILED', true, error);
    }

    if (!newUri) return failed('UPLOAD_FAILED', true);

    // 5. Re-read before committing; stop if another device/process already advanced.
    let latest: LCR | undefined;

    try {
        latest = await readRecord(wallet, current.id);
    } catch (error) {
        await bestEffortDeleteUpload(wallet, newUri);

        return failed('READ_FAILED', true, error);
    }

    if (!latest) {
        await bestEffortDeleteUpload(wallet, newUri);

        return failed('RECORD_MISSING', false);
    }

    const latestMetadata = latest.refresh;

    const alreadyAdvanced =
        latest.uri !== current.uri ||
        (result.managedVersion !== undefined &&
            latestMetadata?.managedVersion !== undefined &&
            latestMetadata.managedVersion >= result.managedVersion);

    if (alreadyAdvanced) {
        await bestEffortDeleteUpload(wallet, newUri);

        return { status: 'superseded', record: latest };
    }

    // 6. Update the same index record in one call.
    const headMetadata = latestMetadata ?? base;

    const history = [...headMetadata.history];

    if (!history.some(entry => entry.uri === current.uri)) {
        history.push({
            uri: current.uri,
            ...(headMetadata.managedVersion !== undefined
                ? { managedVersion: headMetadata.managedVersion }
                : {}),
            ...(effectiveDateOf(vc) ? { effectiveAt: effectiveDateOf(vc) } : {}),
            capturedAt: now,
            ...(headMetadata.updateSummary ? { updateSummary: headMetadata.updateSummary } : {}),
        });
    }

    const nextMetadata: CredentialRefreshMetadata = {
        ...headMetadata,
        ...(result.etag ? { etag: result.etag } : {}),
        ...(result.managedVersion !== undefined ? { managedVersion: result.managedVersion } : {}),
        lastCheckedAt: now,
        lastUpdatedAt: now,
        unreadUpdate: true,
        history,
    };

    let updated: boolean;

    try {
        updated = await wallet.index.LearnCloud.update(current.id, {
            uri: newUri,
            refresh: nextMetadata,
        });
    } catch (error) {
        await bestEffortDeleteUpload(wallet, newUri);

        return failed('INDEX_UPDATE_FAILED', true, error);
    }

    if (!updated) {
        await bestEffortDeleteUpload(wallet, newUri);

        return failed('INDEX_UPDATE_FAILED', true);
    }

    // 7. App-local URI state follows the replacement only after persistence succeeds.
    followNewCredsIndicator(latest, current.uri, newUri);

    return {
        status: 'updated',
        record: { ...latest, uri: newUri, refresh: nextMetadata },
        uri: newUri,
        previousUri: current.uri,
    };
};

/**
 * Refreshes one LearnCloud credential in place. Concurrent calls for the same wallet
 * DID and index record ID are coalesced: callers share the in-flight promise.
 */
export const refreshLearnCloudCredential = ({
    wallet,
    record,
    force = false,
}: RefreshLearnCloudCredentialParams): Promise<LearnCloudCredentialRefreshResult> => {
    const inFlightKey = getInFlightRefreshKey(wallet, record.id);
    const existing = inFlightRefreshes.get(inFlightKey);

    if (existing) return existing;

    const promise = performRefresh(wallet, record, force);

    inFlightRefreshes.set(inFlightKey, promise);

    // The performed refresh never rejects; release the mutex once it settles.
    void promise.finally(() => {
        if (inFlightRefreshes.get(inFlightKey) === promise) {
            inFlightRefreshes.delete(inFlightKey);
        }
    });

    return promise;
};
