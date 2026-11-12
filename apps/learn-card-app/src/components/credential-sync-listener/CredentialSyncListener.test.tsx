import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
    enqueuePendingContractSync,
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
vi.mock('../common/ContractSyncStatusBanner', () => ({ default: () => null }));

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    mocks.track.mockClear();
    pendingContractSyncStore.set.jobs({});
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

it('reports contract progress and completion even when a credential job is newer', () => {
    const contract = enqueuePendingContractSync({
        profileDid: 'did:example:learner',
        contractUri: 'contract-a',
        termsUri: 'terms-a',
        ownerDid: 'did:example:owner',
    });
    pendingContractSyncStore.set.markRunning(contract.id);
    vi.setSystemTime(2000);
    const credential = enqueuePendingContractSync({
        kind: 'credential',
        profileDid: 'did:example:learner',
        record: { id: 'saved', uri: 'credential-a', category: 'Achievement' },
        category: 'Achievement',
    });
    render(<CredentialSyncListener />);
    expect(mocks.track).toHaveBeenCalledWith(
        'sync-job',
        expect.objectContaining({ contractUri: 'contract-a', phase: 'running' })
    );
    act(() => {
        vi.setSystemTime(3000);
        pendingContractSyncStore.set.markDone(contract.id);
        vi.setSystemTime(4000);
        pendingContractSyncStore.set.markRunning(credential.id);
    });
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
