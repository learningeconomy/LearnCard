import { isDeadlineError } from './withDeadline';

/**
 * Whether a thrown error is a transient connectivity failure rather than a real
 * fault. Offline boot must treat these as "no session yet" (→ idle) instead of
 * a hard `error`, which would otherwise surface an error overlay and drive a
 * re-init loop while the device is offline. Covers Firebase's
 * `auth/network-request-failed`, our own deadline timeouts, and common fetch
 * failure messages across browsers/webviews.
 */
export const isNetworkError = (e: unknown): boolean => {
    if (isDeadlineError(e)) return true;

    if (typeof (e as { code?: unknown })?.code === 'string') {
        const code = (e as { code: string }).code.toLowerCase();
        if (code.includes('network-request-failed') || code.includes('network_error')) return true;
    }

    const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();

    return (
        msg.includes('network-request-failed') ||
        msg.includes('network request failed') ||
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('network error') ||
        msg.includes('err_internet_disconnected') ||
        msg.includes('load failed')
    );
};
