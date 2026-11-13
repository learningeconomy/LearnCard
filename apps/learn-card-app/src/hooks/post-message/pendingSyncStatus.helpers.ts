import {
    isJobTerminal,
    MAX_JOB_RETRIES,
    pendingContractSyncStore,
} from 'learn-card-base/stores/pendingContractSyncStore';

export interface PendingSyncStatus {
    status: 'syncing' | 'ready' | 'error';
    progress: {
        totalCredentials: number;
        completedCredentials: number;
        failedCredentials: number;
        retryCount: number;
    };
    lastError?: string;
}

export const getPendingSyncStatus = (
    profileDid: string | undefined,
    contractUri?: string
): PendingSyncStatus => {
    const jobs = Object.values(pendingContractSyncStore.get.jobs()).filter(job => {
        if (job.profileDid !== profileDid) return false;
        if (!contractUri) return true;
        // Unknown destinations delay readiness only while delivery is active.
        // Terminal failures belong to the contracts that actually failed, not every partner.
        if (job.kind === 'credential') {
            return (
                !isJobTerminal(job) ||
                (job.status === 'error' && Boolean(job.failedContractUris?.includes(contractUri)))
            );
        }
        return job.contractUri === contractUri;
    });
    const activeJobs = jobs.filter(
        job =>
            job.status === 'queued' ||
            job.status === 'running' ||
            (job.status === 'error' && job.retryCount < MAX_JOB_RETRIES)
    );
    const latestTerminalJob = jobs
        .filter(isJobTerminal)
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];
    const relevantJobs =
        activeJobs.length > 0 ? activeJobs : latestTerminalJob ? [latestTerminalJob] : [];
    const progress = relevantJobs.reduce(
        (summary, job) => ({
            totalCredentials: summary.totalCredentials + job.totalCredentials,
            completedCredentials: summary.completedCredentials + job.completedCredentials,
            failedCredentials: summary.failedCredentials + job.failedCredentials,
            retryCount: summary.retryCount + job.retryCount,
        }),
        {
            totalCredentials: 0,
            completedCredentials: 0,
            failedCredentials: 0,
            retryCount: 0,
        }
    );
    if (activeJobs.length > 0) return { status: 'syncing', progress };
    if (latestTerminalJob?.status === 'error') {
        return { status: 'error', progress, lastError: latestTerminalJob.lastError };
    }
    return { status: 'ready', progress };
};

export const waitForPendingSync = async (
    profileDid: string | undefined,
    contractUri?: string,
    timeoutMs = 25000
): Promise<PendingSyncStatus> => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        const status = getPendingSyncStatus(profileDid, contractUri);
        if (status.status !== 'syncing') return status;
        await new Promise<void>(resolve => setTimeout(resolve, 500));
    }
    return getPendingSyncStatus(profileDid, contractUri);
};
