import React, { useEffect, useMemo, useRef, useState } from 'react';

import { AnalyticsEvents, useAnalytics } from '@analytics';
import { usePendingContractSyncJobs, type PendingContractSyncJob } from 'learn-card-base';

import ContractSyncStatusBanner from '../common/ContractSyncStatusBanner';

const COMPLETED_BANNER_DURATION_MS = 3500;

const CredentialSyncListener: React.FC = () => {
    const analytics = useAnalytics();
    const pendingContractSyncJobs = usePendingContractSyncJobs();

    const activeContractSyncJob = useMemo(
        () =>
            Object.values(pendingContractSyncJobs)
                .filter(job => job.status === 'queued' || job.status === 'running')
                .sort((a, b) => a.createdAt - b.createdAt)[0],
        [pendingContractSyncJobs]
    );
    const [completedContractSyncJob, setCompletedContractSyncJob] =
        useState<PendingContractSyncJob | null>(null);
    const completedContractSyncJobTimeoutRef = useRef<number | null>(null);
    const completedContractSyncJobIdRef = useRef<string | null>(null);
    const contractSyncTelemetryKeyRef = useRef<string | null>(null);

    useEffect(() => {
        const newestDoneJob = Object.values(pendingContractSyncJobs)
            .filter(job => job.status === 'done' && job.finishedAt)
            .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))[0];

        if (!newestDoneJob || completedContractSyncJobIdRef.current === newestDoneJob.id) {
            return;
        }

        completedContractSyncJobIdRef.current = newestDoneJob.id;
        setCompletedContractSyncJob(newestDoneJob);
    }, [pendingContractSyncJobs]);

    useEffect(() => {
        if (!completedContractSyncJob) {
            return;
        }

        if (completedContractSyncJobTimeoutRef.current) {
            window.clearTimeout(completedContractSyncJobTimeoutRef.current);
        }

        completedContractSyncJobTimeoutRef.current = window.setTimeout(() => {
            setCompletedContractSyncJob(null);
            completedContractSyncJobTimeoutRef.current = null;
        }, COMPLETED_BANNER_DURATION_MS);

        return () => {
            if (completedContractSyncJobTimeoutRef.current) {
                window.clearTimeout(completedContractSyncJobTimeoutRef.current);
                completedContractSyncJobTimeoutRef.current = null;
            }
        };
    }, [completedContractSyncJob]);

    useEffect(() => {
        const jobs = Object.values(pendingContractSyncJobs);
        if (!jobs.length) return;

        const newestJob = jobs.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        const telemetryKey = [
            newestJob.id,
            newestJob.status,
            newestJob.processedCredentials,
            newestJob.completedCredentials,
            newestJob.failedCredentials,
            newestJob.retryCount,
        ].join(':');

        if (contractSyncTelemetryKeyRef.current === telemetryKey) return;
        contractSyncTelemetryKeyRef.current = telemetryKey;

        analytics.track(AnalyticsEvents.CONSENT_FLOW_SYNC_JOB, {
            contractUri: newestJob.contractUri,
            termsUri: newestJob.termsUri,
            ownerDid: newestJob.ownerDid,
            phase: newestJob.status,
            elapsedMs:
                newestJob.startedAt && newestJob.finishedAt
                    ? newestJob.finishedAt - newestJob.startedAt
                    : undefined,
            totalCredentials: newestJob.totalCredentials,
            processedCredentials: newestJob.processedCredentials,
            completedCredentials: newestJob.completedCredentials,
            failedCredentials: newestJob.failedCredentials,
            retryCount: newestJob.retryCount,
        });
    }, [analytics, pendingContractSyncJobs]);

    return (
        <>
            {activeContractSyncJob && (
                <ContractSyncStatusBanner job={activeContractSyncJob} variant="active" />
            )}
            {completedContractSyncJob && (
                <ContractSyncStatusBanner
                    job={completedContractSyncJob}
                    variant="complete"
                    onDismiss={() => {
                        if (completedContractSyncJobTimeoutRef.current) {
                            window.clearTimeout(completedContractSyncJobTimeoutRef.current);
                            completedContractSyncJobTimeoutRef.current = null;
                        }
                        setCompletedContractSyncJob(null);
                    }}
                />
            )}
        </>
    );
};

export default CredentialSyncListener;
