/**
 * Session-wide single-flight for claiming a requested transcript. Kept free of other
 * imports so every claimer (`useTranscriptArrival` instances on WalletPage and
 * SchoolConnect, and the notification deep link in `NotificationBoostCard`) shares
 * the same module-level state.
 */
const transcriptClaims = new Map<string, Promise<void>>();

/**
 * Runs `claim` at most once per transcript request per app session, so the same
 * transcript is never added to the wallet twice. The first caller runs `claim`;
 * anyone calling while it runs, or after it succeeded, waits for that same claim
 * instead. A failed claim is forgotten so it can be retried.
 *
 * @returns true when this call ran the claim (and so owns the follow-up "mark
 * received" acknowledgement and analytics), false when it joined a claim made
 * elsewhere.
 */
export const claimTranscriptOnce = async (
    requestId: string,
    claim: () => Promise<void>
): Promise<boolean> => {
    const existing = transcriptClaims.get(requestId);
    if (existing) {
        await existing;
        return false;
    }
    const pending = Promise.resolve().then(claim);
    transcriptClaims.set(requestId, pending);
    try {
        await pending;
    } catch (error) {
        if (transcriptClaims.get(requestId) === pending) transcriptClaims.delete(requestId);
        throw error;
    }
    return true;
};

/** True when a claim for this request is running or already succeeded this session. */
export const isTranscriptClaimStarted = (requestId: string): boolean =>
    transcriptClaims.has(requestId);

/** Test-only: forgets every claim made this session. */
export const resetTranscriptClaims = (): void => {
    transcriptClaims.clear();
};
