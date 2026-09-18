import type { InboxBatchStatus, IssueInboxCredentialBatch } from '@learncard/types';
import type { Context } from '@routes';

export type BatchItem = {
    id: string;
    batchId: string;
    index: number;
    state: InboxBatchStatus['items'][number]['state'];
    phase?: 'PREPARING' | 'ISSUING';
    owner?: string;
    leaseUntil?: number;
    attempts: number;
    result?: string;
    replayKey: string;
    duplicate: boolean;
};

export type BatchJob = {
    id: string;
    issuer: string;
    createdAt: number;
    payload?: string;
    completedAt?: number;
};

export type BatchJobPayload = {
    batch: IssueInboxCredentialBatch;
    context: Pick<Context, 'domain' | 'tenant'>;
};

export type BatchReplayStore = {
    get: (key: string) => Promise<string | null | undefined>;
    setIfAbsent: (key: string, value: string, ttl: number) => Promise<'OK' | null | undefined>;
    compareAndSet: (
        key: string,
        expected: string,
        value: string | null,
        ttl: number
    ) => Promise<boolean | undefined>;
};
