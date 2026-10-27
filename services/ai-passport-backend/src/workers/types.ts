// src/jobs/types.ts

/**
 * Type alias for the possible states of a background job.
 */
export type JobStatus = 'active' | 'waiting' | 'completed' | 'failed' | 'delayed' | 'paused';

/** The only application data permitted in BullMQ. */
export type OwnerJobData = { referenceId: string };

export type CredentialIngestionJobData = OwnerJobData;

/** Private payloads are stored in fenced Mongo work items, never BullMQ. */
export type CredentialIngestionPayload = {
    source: string;
    locale: string | null;
};

export type ConversationSummaryPayload = {
    threadId: string;
    locale: string | null;
};

/**
 * Shared interface representing the structure of a background job's status,
 * particularly for communication via WebSockets.
 */
export type BackgroundJob = {
    id: string;
    type?: string; // e.g., 'credentialIngestion'
    status?: JobStatus; // Use the type alias
    progress?: number; // 0-100
    message?: string; // User-friendly status message
    result?: any; // Data returned upon successful completion
    error?: string; // Error message if failed
    timestamp?: number; // Timestamp of the last update (e.g., job.timestamp)
    // BullMQ specific details that might be useful
    attemptsMade?: number;
    failedReason?: string;
    processedOn?: number; // Timestamp when processing started
    finishedOn?: number; // Timestamp when job finished (completed or failed)
    data?: OwnerJobData;
};
