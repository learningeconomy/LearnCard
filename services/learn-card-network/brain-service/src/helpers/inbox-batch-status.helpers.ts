import type { InboxBatchStatus } from '@learncard/types';

/** Use the same state precedence for polling and submission replay receipts. */
export const getInboxBatchState = (
    states: InboxBatchStatus['items'][number]['state'][]
): InboxBatchStatus['status'] => {
    if (states.includes('NEEDS_RECONCILIATION')) return 'NEEDS_RECONCILIATION';
    if (states.every(state => state === 'COMPLETED')) return 'COMPLETED';
    return states.every(state => state === 'QUEUED') ? 'QUEUED' : 'PROCESSING';
};
