import type { ClaimLinkRequestStatus, ClaimLinkTerminalReason } from '@learncard/types';

export type ClaimStage = 'checking' | 'claiming' | 'saving' | 'refreshing';

export type ClaimProgress =
    | { status: 'idle' }
    | { status: 'working'; stage: ClaimStage }
    | { status: 'failed'; stage: ClaimStage; saved: boolean }
    | { status: 'pending' }
    | { status: 'terminal'; reason: ClaimLinkTerminalReason }
    | { status: 'context-changed' }
    | { status: 'complete' };

export type ClaimAttempt = {
    requestId: string;
    credentialUri?: string;
    saved: boolean;
    running: boolean;
    complete: boolean;
};

type ClaimOperations = {
    check: () => Promise<ClaimLinkRequestStatus>;
    claim: () => Promise<string>;
    save: (credentialUri: string) => Promise<void>;
    refresh: (credentialUri: string) => Promise<void>;
};

/** Keep the result of each committed stage; recovery never repeats a known success. */
export const recoverClaim = async (
    attempt: ClaimAttempt,
    operations: ClaimOperations,
    onProgress: (progress: ClaimProgress) => void,
    onFailure?: (stage: ClaimStage, error: unknown) => void
): Promise<boolean> => {
    if (attempt.running) return false;
    if (attempt.complete) return true;
    attempt.running = true;
    let stage: ClaimStage = 'checking';
    const progress = (next: ClaimStage) => {
        stage = next;
        onProgress({ status: 'working', stage });
    };

    try {
        if (!attempt.credentialUri) {
            progress('checking');
            const result = await operations.check();
            if (result.status === 'pending') {
                onProgress({ status: 'pending' });
                return false;
            }
            if (result.status === 'terminal') {
                onProgress(result);
                return false;
            }
            if (result.status === 'complete') {
                attempt.credentialUri = result.credentialUri;
            } else {
                progress('claiming');
                attempt.credentialUri = await operations.claim();
            }
        }
        if (!attempt.saved) {
            progress('saving');
            await operations.save(attempt.credentialUri);
            attempt.saved = true;
        }
        progress('refreshing');
        await operations.refresh(attempt.credentialUri);
        attempt.complete = true;
        onProgress({ status: 'complete' });
        return true;
    } catch (error) {
        // A mutation error is not proof of rejection: the next run checks its actual result.
        onProgress({ status: 'failed', stage, saved: attempt.saved });
        onFailure?.(stage, error);
        return false;
    } finally {
        attempt.running = false;
    }
};

/** Keep the same opaque identifier for this tab's claim context; no credential data is persisted. */
export const getClaimRequest = async (
    context: string
): Promise<{ requestId: string; key: string }> => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(context));
    const hash = Array.from(new Uint8Array(digest), byte =>
        byte.toString(16).padStart(2, '0')
    ).join('');
    const key = `learncard:claim-request:${hash}`;
    const requestId = sessionStorage.getItem(key) ?? crypto.randomUUID();
    sessionStorage.setItem(key, requestId);
    return { key, requestId };
};
