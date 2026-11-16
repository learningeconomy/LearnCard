import { expect, test } from 'bun:test';
import {
    isRetryableSourceCleanupError,
    isSourceCleanupLeaseBusyError,
    SOURCE_CLEANUP_BUSY_MESSAGE,
    SOURCE_CLEANUP_LEASE_EXPIRED_MESSAGE,
    SOURCE_CLEANUP_PENDING_MESSAGE,
    SOURCE_CLEANUP_SCOPE_CHANGED_MESSAGE,
} from './source-cleanup';

test('identifies lease contention separately from other cleanup retry errors', () => {
    expect(isSourceCleanupLeaseBusyError(new Error(SOURCE_CLEANUP_BUSY_MESSAGE))).toBe(true);
    expect(isSourceCleanupLeaseBusyError(new Error(SOURCE_CLEANUP_LEASE_EXPIRED_MESSAGE))).toBe(
        true
    );
    expect(isSourceCleanupLeaseBusyError(new Error(SOURCE_CLEANUP_PENDING_MESSAGE))).toBe(false);
    expect(isSourceCleanupLeaseBusyError(new Error('other'))).toBe(false);
    expect(isRetryableSourceCleanupError(new Error(SOURCE_CLEANUP_BUSY_MESSAGE))).toBe(true);
    expect(isRetryableSourceCleanupError(new Error(SOURCE_CLEANUP_PENDING_MESSAGE))).toBe(true);
    expect(isRetryableSourceCleanupError(new Error(SOURCE_CLEANUP_SCOPE_CHANGED_MESSAGE))).toBe(
        true
    );
    expect(isRetryableSourceCleanupError(new Error('Credential verification failed'))).toBe(false);
});
