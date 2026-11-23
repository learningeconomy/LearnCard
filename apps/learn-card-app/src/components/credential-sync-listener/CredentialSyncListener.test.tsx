import 'fake-indexeddb/auto';
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
    clearPendingContractSyncJob,
    enqueuePendingContractSync,
    hydratePendingContractSyncJobs,
    pendingContractSyncStore,
} from 'learn-card-base/stores/pendingContractSyncStore';

import CredentialSyncListener from './CredentialSyncListener';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@analytics', () => ({
    AnalyticsEvents: {
        CONSENT_FLOW_SYNC_JOB: 'sync-job',
        CONSENT_SYNC_COMPLETED: 'sync-completed',
        CONSENT_SYNC_FAILED: 'sync-failed',
    },
    useAnalytics: () => ({ track: mocks.track }),
}));
vi.mock('learn-card-base', async () => {
    const { usePendingContractSyncJobs } =
        await import('learn-card-base/stores/pendingContractSyncStore');
    return { usePendingContractSyncJobs };
});

beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(1000);
    mocks.track.mockClear();
    await hydratePendingContractSyncJobs();
    await Promise.all(
        Object.keys(pendingContractSyncStore.get.jobs()).map(clearPendingContractSyncJob)
    );
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

it('reports contract progress and completion even when a credential job is newer', async () => {
    const contract = await enqueuePendingContractSync({
        profileDid: 'did:example:learner',
        contractUri: 'contract-a',
        termsUri: 'terms-a',
        ownerDid: 'did:example:owner',
    });
    const contractAttempt = (await pendingContractSyncStore.set.claimJob(contract.id))!
        .processingAttemptId!;
    vi.setSystemTime(2000);
    const credential = await enqueuePendingContractSync({
        kind: 'credential',
        profileDid: 'did:example:learner',
        record: { id: 'saved', uri: 'credential-a', category: 'Achievement' },
        category: 'Achievement',
    });
    render(<CredentialSyncListener />);
    expect(screen.getByText('Syncing')).toBeVisible();
    expect(mocks.track).toHaveBeenCalledWith(
        'sync-job',
        expect.objectContaining({ contractUri: 'contract-a', phase: 'running' })
    );
    await act(async () => {
        vi.setSystemTime(3000);
        await pendingContractSyncStore.set.markDone(contract.id, contractAttempt);
        vi.setSystemTime(4000);
        await pendingContractSyncStore.set.claimJob(credential.id);
    });
    expect(screen.getByText('Syncing complete')).toBeVisible();
    expect(screen.queryByText('Syncing')).not.toBeInTheDocument();
    expect(mocks.track).toHaveBeenCalledWith(
        'sync-job',
        expect.objectContaining({ contractUri: 'contract-a', phase: 'done' })
    );
    expect(mocks.track).toHaveBeenCalledWith(
        'sync-completed',
        expect.objectContaining({ contractUri: 'contract-a' })
    );
    expect(mocks.track.mock.calls.every(([, data]) => data.contractUri === 'contract-a')).toBe(
        true
    );
});

it('does not show active or complete contract banners for background credential delivery', async () => {
    const job = await enqueuePendingContractSync({
        kind: 'credential',
        profileDid: 'did:example:learner',
        record: { id: 'saved', uri: 'credential-a', category: 'Achievement' },
        category: 'Achievement',
    });
    const attemptId = (await pendingContractSyncStore.set.claimJob(job.id))!.processingAttemptId!;
    render(<CredentialSyncListener />);
    expect(screen.queryByText(/Syncing/)).not.toBeInTheDocument();
    await act(async () => {
        await pendingContractSyncStore.set.setTotals(job.id, 1, attemptId);
        await pendingContractSyncStore.set.markDone(job.id, attemptId);
    });
    expect(screen.queryByText(/Syncing/)).not.toBeInTheDocument();
    expect(mocks.track).not.toHaveBeenCalled();
});
