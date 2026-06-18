import type { RecipientMode } from './components/recipientTypes';

export interface IssueError {
    message: string;
    canRetry: boolean;
}

const errorMessage = (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message ?? '');
    }
    return '';
};

const TRANSIENT_PATTERN =
    /network|fetch|connection|offline|timeout|timed out|\b5\d\d\b|internal server|bad gateway|unavailable| econnreset|gateway|lca-api returned/i;

/** Transient failures are worth an automatic retry before bothering the user. */
export const isTransientError = (error: unknown): boolean =>
    TRANSIENT_PATTERN.test(errorMessage(error));

/**
 * Translates raw issuance failures into clean, jargon-free, actionable copy.
 * `canRetry` drives whether the UI offers a "Try Again" affordance.
 */
export const getFriendlyIssueError = (error: unknown, mode: RecipientMode): IssueError => {
    const msg = errorMessage(error);

    if (/network|fetch|connection|offline/i.test(msg)) {
        return {
            message: 'Connection issue. Check your internet and try again.',
            canRetry: true,
        };
    }

    if (/timeout|timed out/i.test(msg)) {
        return { message: 'That took longer than expected. Please try again.', canRetry: true };
    }

    if (/unauthor|\b401\b|\b403\b|forbidden|not signed in|session/i.test(msg)) {
        return {
            message: 'Your session may have expired. Sign in again and try once more.',
            canRetry: true,
        };
    }

    if (/\b5\d\d\b|internal server|bad gateway|unavailable|lca-api returned/i.test(msg)) {
        return { message: 'Our servers hit a snag. Please try again in a moment.', canRetry: true };
    }

    if (/signing authority|claim link|generateclaimlink/i.test(msg)) {
        return {
            message:
                mode === 'link'
                    ? "We couldn't create a shareable link. Please try again."
                    : "We couldn't set up issuing for your account. Please try again.",
            canRetry: true,
        };
    }

    if (mode === 'people' && /profile|recipient|not found|does not exist|no such/i.test(msg)) {
        return {
            message:
                "We couldn't reach one of your recipients. Double-check the names or emails and try again.",
            canRetry: true,
        };
    }

    if (/invalid|validation|not a credential|schema|expansion|malformed/i.test(msg)) {
        return {
            message:
                "Some details on this credential aren't valid yet. Please review and try again.",
            canRetry: false,
        };
    }

    return {
        message: 'Something went wrong issuing your credential. Please try again.',
        canRetry: true,
    };
};

/** Runs `fn`, retrying once after a short backoff if the failure looks transient. */
export const withTransientRetry = async <T>(
    fn: () => Promise<T>,
    retries = 1,
    delayMs = 1000
): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0 && isTransientError(error)) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return withTransientRetry(fn, retries - 1, delayMs * 2);
        }
        throw error;
    }
};
