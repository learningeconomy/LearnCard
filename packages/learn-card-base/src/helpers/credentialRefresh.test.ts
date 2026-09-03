import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CredentialRefreshResult, VC } from '@learncard/types';

import type { BespokeLearnCard } from '../types/learn-card';
import { CredentialRefreshMetadata, LCR } from '../types/credential-records';
import { newCredsStore } from '../stores/newCredsStore';

import {
    CREDENTIAL_REFRESH_CHECK_INTERVAL_MS,
    refreshLearnCloudCredential,
} from './credentialRefresh';

const NOW_ISO = '2026-09-02T12:00:00.000Z';

const SERVICE_ID = 'https://refresh.example.com/refresh/refresh-1';

const baseMetadata = (
    overrides: Partial<CredentialRefreshMetadata> = {}
): CredentialRefreshMetadata => ({
    serviceId: SERVICE_ID,
    serviceType: '1EdTechCredentialRefresh',
    credentialId: 'urn:uuid:credential-1',
    etag: 'etag-1',
    managedVersion: 1,
    // Stale by default so ordinary (non-forced) calls proceed to a live check.
    lastCheckedAt: '2026-09-01T11:00:00.000Z',
    history: [],
    ...overrides,
});

const baseRecord = (overrides: Partial<LCR> = {}): LCR => ({
    id: 'record-1',
    uri: 'lc:earn:old',
    category: 'Achievement',
    refresh: baseMetadata(),
    ...overrides,
});

const currentVc = {
    id: 'urn:uuid:credential-1',
    issuer: 'did:example:issuer',
    issuanceDate: '2026-01-01T00:00:00.000Z',
    credentialSubject: { id: 'did:example:holder' },
    refreshService: { id: SERVICE_ID, type: '1EdTechCredentialRefresh' },
} as unknown as VC;

const updatedVc = {
    ...currentVc,
    issuanceDate: '2026-08-01T00:00:00.000Z',
    credentialSubject: { id: 'did:example:holder', achievement: { name: 'Updated' } },
} as unknown as VC;

const updatedResult = (
    overrides: Partial<Extract<CredentialRefreshResult, { status: 'updated' }>> = {}
): CredentialRefreshResult => ({
    status: 'updated',
    credential: updatedVc,
    etag: 'etag-2',
    managedVersion: 2,
    ...overrides,
});

const makeWallet = () => {
    const indexGet = vi.fn(async () => [baseRecord()]);
    const indexUpdate = vi.fn(async () => true);
    const readGet = vi.fn(async () => currentVc);
    const uploadEncrypted = vi.fn(async () => 'lc:earn:new');
    const storeDelete = vi.fn(async () => true);
    const refreshCredential = vi.fn(async (): Promise<CredentialRefreshResult> => updatedResult());

    const wallet = {
        index: { LearnCloud: { get: indexGet, update: indexUpdate } },
        read: { get: readGet },
        store: { LearnCloud: { uploadEncrypted, delete: storeDelete } },
        invoke: { refreshCredential },
    } as unknown as BespokeLearnCard;

    return {
        wallet,
        indexGet,
        indexUpdate,
        readGet,
        uploadEncrypted,
        storeDelete,
        refreshCredential,
    };
};

describe('refreshLearnCloudCredential', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(NOW_ISO));
    });

    afterEach(() => {
        newCredsStore.set.clearAllNewCreds();
        vi.useRealTimers();
    });

    describe('unchanged response', () => {
        it('updates check metadata on the same record without touching the URI or history', async () => {
            const { wallet, indexUpdate, uploadEncrypted, refreshCredential } = makeWallet();
            refreshCredential.mockResolvedValue({
                status: 'unchanged',
                checkedAt: NOW_ISO,
                etag: 'etag-2',
            });

            const result = await refreshLearnCloudCredential({ wallet, record: baseRecord() });

            expect(result.status).toBe('unchanged');
            expect(refreshCredential).toHaveBeenCalledWith(currentVc, { etag: 'etag-1' });
            expect(uploadEncrypted).not.toHaveBeenCalled();

            expect(indexUpdate).toHaveBeenCalledTimes(1);
            const [id, updates] = indexUpdate.mock.calls[0]!;
            expect(id).toBe('record-1');
            expect(updates.uri).toBeUndefined();
            expect(updates.refresh).toMatchObject({
                serviceId: SERVICE_ID,
                credentialId: 'urn:uuid:credential-1',
                etag: 'etag-2',
                managedVersion: 1,
                lastCheckedAt: NOW_ISO,
                history: [],
            });
            expect(updates.refresh.lastUpdatedAt).toBeUndefined();
            expect(updates.refresh.unreadUpdate).toBeUndefined();
        });
    });

    describe('successful replacement', () => {
        it('replaces the URI on the same index record and returns the updated outcome', async () => {
            const { wallet, indexGet, indexUpdate, uploadEncrypted } = makeWallet();

            const result = await refreshLearnCloudCredential({ wallet, record: baseRecord() });

            expect(result.status).toBe('updated');

            if (result.status !== 'updated') throw new Error('unreachable');

            expect(result.uri).toBe('lc:earn:new');
            expect(result.previousUri).toBe('lc:earn:old');
            expect(result.record.id).toBe('record-1');
            expect(result.record.uri).toBe('lc:earn:new');

            expect(uploadEncrypted).toHaveBeenCalledWith(updatedVc);

            // Re-read before commit, then a single update to the same record ID.
            expect(indexGet).toHaveBeenCalledTimes(2);
            expect(indexUpdate).toHaveBeenCalledTimes(1);
            expect(indexUpdate.mock.calls[0]![0]).toBe('record-1');
            expect(indexUpdate.mock.calls[0]![1].uri).toBe('lc:earn:new');
        });

        it('appends the old URI to history exactly once and marks the update unread', async () => {
            const { wallet, indexUpdate } = makeWallet();

            await refreshLearnCloudCredential({ wallet, record: baseRecord() });

            const refresh = indexUpdate.mock.calls[0]![1].refresh as CredentialRefreshMetadata;

            expect(refresh.history.filter(entry => entry.uri === 'lc:earn:old')).toHaveLength(1);
            expect(refresh.history[0]).toMatchObject({
                uri: 'lc:earn:old',
                managedVersion: 1,
                effectiveAt: '2026-01-01T00:00:00.000Z',
                capturedAt: NOW_ISO,
            });
            expect(refresh.unreadUpdate).toBe(true);
        });

        it('does not duplicate the old URI when history already contains it', async () => {
            const { wallet, indexUpdate } = makeWallet();
            const record = baseRecord({
                refresh: baseMetadata({
                    history: [{ uri: 'lc:earn:old', capturedAt: '2026-06-01T00:00:00.000Z' }],
                }),
            });

            await refreshLearnCloudCredential({ wallet, record });

            const refresh = indexUpdate.mock.calls[0]![1].refresh as CredentialRefreshMetadata;

            expect(refresh.history.filter(entry => entry.uri === 'lc:earn:old')).toHaveLength(1);
        });

        it('updates ETag, managed version, and check/update timestamps', async () => {
            const { wallet, indexUpdate } = makeWallet();

            await refreshLearnCloudCredential({ wallet, record: baseRecord() });

            const refresh = indexUpdate.mock.calls[0]![1].refresh as CredentialRefreshMetadata;

            expect(refresh).toMatchObject({
                etag: 'etag-2',
                managedVersion: 2,
                lastCheckedAt: NOW_ISO,
                lastUpdatedAt: NOW_ISO,
            });
        });

        it('initializes refresh metadata for a lazily discovered external credential', async () => {
            const { wallet, indexGet, indexUpdate } = makeWallet();
            const record = baseRecord({ refresh: undefined });
            indexGet.mockResolvedValue([record]);

            const result = await refreshLearnCloudCredential({ wallet, record });

            expect(result.status).toBe('updated');

            const refresh = indexUpdate.mock.calls[0]![1].refresh as CredentialRefreshMetadata;

            expect(refresh).toMatchObject({
                serviceId: SERVICE_ID,
                serviceType: '1EdTechCredentialRefresh',
                credentialId: 'urn:uuid:credential-1',
                etag: 'etag-2',
                managedVersion: 2,
                lastCheckedAt: NOW_ISO,
                lastUpdatedAt: NOW_ISO,
                unreadUpdate: true,
            });
            expect(refresh.history.map(entry => entry.uri)).toEqual(['lc:earn:old']);
        });

        it('moves the new-credential indicator from the old URI to the new URI', async () => {
            const { wallet } = makeWallet();
            newCredsStore.set.addNewCreds({ Achievement: ['lc:earn:old'] });

            const result = await refreshLearnCloudCredential({ wallet, record: baseRecord() });

            expect(result.status).toBe('updated');

            const newCreds = newCredsStore.get.state().newCreds;

            expect(newCreds.Achievement).toEqual(['lc:earn:new']);
        });
    });

    describe('staleness guard', () => {
        it('skips a live check when the record was checked within the check interval', async () => {
            const { wallet, indexGet, refreshCredential } = makeWallet();
            const record = baseRecord({
                refresh: baseMetadata({
                    lastCheckedAt: new Date(
                        Date.parse(NOW_ISO) - CREDENTIAL_REFRESH_CHECK_INTERVAL_MS / 2
                    ).toISOString(),
                }),
            });
            indexGet.mockResolvedValue([record]);

            const result = await refreshLearnCloudCredential({ wallet, record });

            expect(result).toMatchObject({ status: 'skipped', reason: 'recently-checked' });
            expect(refreshCredential).not.toHaveBeenCalled();
        });

        it('performs a live check when forced despite a recent check', async () => {
            const { wallet, indexGet, refreshCredential } = makeWallet();
            const record = baseRecord({
                refresh: baseMetadata({ lastCheckedAt: NOW_ISO }),
            });
            indexGet.mockResolvedValue([record]);
            refreshCredential.mockResolvedValue({ status: 'unchanged', checkedAt: NOW_ISO });

            const result = await refreshLearnCloudCredential({ wallet, record, force: true });

            expect(result.status).toBe('unchanged');
            expect(refreshCredential).toHaveBeenCalledTimes(1);
        });
    });

    describe('concurrency', () => {
        it('coalesces concurrent calls for the same record into one in-flight refresh', async () => {
            const { wallet, refreshCredential } = makeWallet();

            let resolveRefresh: (result: CredentialRefreshResult) => void = () => {};
            refreshCredential.mockImplementation(
                () =>
                    new Promise<CredentialRefreshResult>(resolve => {
                        resolveRefresh = resolve;
                    })
            );

            const first = refreshLearnCloudCredential({ wallet, record: baseRecord() });
            const second = refreshLearnCloudCredential({ wallet, record: baseRecord() });

            expect(second).toBe(first);

            // Let the coalesced operation reach the refresh primitive before resolving it.
            while (refreshCredential.mock.calls.length === 0) {
                await Promise.resolve();
            }

            resolveRefresh({ status: 'unchanged', checkedAt: NOW_ISO });
            await first;

            expect(refreshCredential).toHaveBeenCalledTimes(1);
        });
    });

    describe('failure handling', () => {
        it('leaves the record intact when the encrypted upload fails', async () => {
            const { wallet, indexUpdate, uploadEncrypted, storeDelete } = makeWallet();
            uploadEncrypted.mockRejectedValue(new Error('storage offline'));

            const result = await refreshLearnCloudCredential({ wallet, record: baseRecord() });

            expect(result).toMatchObject({
                status: 'failed',
                code: 'UPLOAD_FAILED',
                retryable: true,
            });
            expect(indexUpdate).not.toHaveBeenCalled();
            expect(storeDelete).not.toHaveBeenCalled();
        });

        it('keeps the old record and best-effort deletes only the new upload when the index update fails', async () => {
            const { wallet, indexUpdate, storeDelete } = makeWallet();
            indexUpdate.mockResolvedValue(false);

            const result = await refreshLearnCloudCredential({ wallet, record: baseRecord() });

            expect(result).toMatchObject({
                status: 'failed',
                code: 'INDEX_UPDATE_FAILED',
                retryable: true,
            });

            // The unindexed new upload is removed; the still-referenced old URI is not.
            expect(storeDelete).toHaveBeenCalledTimes(1);
            expect(storeDelete).toHaveBeenCalledWith('lc:earn:new');
        });

        it('surfaces primitive failures without mutating the record', async () => {
            const { wallet, indexUpdate, refreshCredential } = makeWallet();
            refreshCredential.mockResolvedValue({
                status: 'failed',
                code: 'UNAVAILABLE',
                retryable: true,
            });

            const result = await refreshLearnCloudCredential({ wallet, record: baseRecord() });

            expect(result).toMatchObject({
                status: 'failed',
                code: 'UNAVAILABLE',
                retryable: true,
            });
            expect(indexUpdate).not.toHaveBeenCalled();
        });

        it('passes through an unsupported outcome without mutating the record', async () => {
            const { wallet, indexUpdate, refreshCredential } = makeWallet();
            refreshCredential.mockResolvedValue({ status: 'unsupported' });

            const result = await refreshLearnCloudCredential({ wallet, record: baseRecord() });

            expect(result.status).toBe('unsupported');
            expect(indexUpdate).not.toHaveBeenCalled();
        });
    });

    describe('multi-device safety', () => {
        it('stops without refreshing when the input record is stale', async () => {
            const { wallet, indexGet, refreshCredential, indexUpdate } = makeWallet();
            indexGet.mockResolvedValue([baseRecord({ uri: 'lc:earn:elsewhere' })]);

            const result = await refreshLearnCloudCredential({ wallet, record: baseRecord() });

            expect(result.status).toBe('superseded');

            if (result.status !== 'superseded') throw new Error('unreachable');

            expect(result.record.uri).toBe('lc:earn:elsewhere');
            expect(refreshCredential).not.toHaveBeenCalled();
            expect(indexUpdate).not.toHaveBeenCalled();
        });

        it('treats the local result as superseded when the final re-read shows another device advanced', async () => {
            const { wallet, indexGet, indexUpdate, storeDelete } = makeWallet();
            indexGet.mockResolvedValueOnce([baseRecord()]).mockResolvedValueOnce([
                baseRecord({
                    uri: 'lc:earn:newer',
                    refresh: baseMetadata({ managedVersion: 3, etag: 'etag-3' }),
                }),
            ]);

            const result = await refreshLearnCloudCredential({ wallet, record: baseRecord() });

            expect(result.status).toBe('superseded');

            if (result.status !== 'superseded') throw new Error('unreachable');

            expect(result.record.uri).toBe('lc:earn:newer');
            expect(indexUpdate).not.toHaveBeenCalled();

            // The unindexed local upload is cleaned up; the advanced head URI is never deleted.
            expect(storeDelete).toHaveBeenCalledTimes(1);
            expect(storeDelete).toHaveBeenCalledWith('lc:earn:new');
        });
    });
});
