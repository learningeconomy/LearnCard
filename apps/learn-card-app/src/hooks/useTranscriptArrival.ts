import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { App } from '@capacitor/app';
import { PushNotifications, type PushNotificationSchema } from '@capacitor/push-notifications';
import type { PluginListenerHandle } from '@capacitor/core';
import type { VC } from '@learncard/types';
import { LCNNotificationTypeEnumValidator } from '@learncard/types';

import {
    useWallet,
    useGetIncomingCredentials,
    claimIncomingCredential,
    parseForegroundPushNotification,
    getLogger,
} from 'learn-card-base';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { useAnalytics, AnalyticsEvents } from '@analytics';
import { storeTranscriptReceipt } from './transcriptReceipt';

import {
    claimTranscriptOnce,
    isTranscriptClaimStarted,
    resetTranscriptClaims,
} from './transcriptClaim';

const log = getLogger('transcript-arrival');

/** First poll delay; doubles after every tick up to `MAX_POLL_MS`. */
export const INITIAL_POLL_MS = 5_000;
/** Backoff ceiling for polling `getIncomingCredentials`. */
export const MAX_POLL_MS = 60_000;
/**
 * How long one request is polled for in a single app session. After this the hook
 * stops polling and reports `isPollingExhausted` so the UI can offer a manual path.
 */
export const POLL_WINDOW_MS = 30 * 60_000;
/**
 * Clock-skew allowance for the issuance-time check. `requestedAt` is the lca-api
 * server's millisecond timestamp, while issuers often sign `validFrom` at whole-second
 * precision on their own clock (and the device clock drives the "not valid yet"
 * verification check), so the comparison tolerates this much disagreement.
 */
export const ISSUANCE_SKEW_MS = 5 * 60_000;
const NOT_VALID_YET_ERROR = 'expiration error: Credential is not valid yet';

/** Restoring an accepted transcript's wallet entry failed; retried with backoff. */
class TranscriptWalletRestoreError extends Error {
    constructor(cause: unknown) {
        super('Failed to restore the accepted transcript to the wallet', { cause });
        this.name = 'TranscriptWalletRestoreError';
    }
}

export type TranscriptRequestStatus = 'requested' | 'none_yet' | 'failed' | undefined;

/**
 * `match` — the credential is the requested transcript.
 * `reject` — it definitively is not (safe to never re-read it for this request).
 * `retry` — the decision depends on a transient condition (verification threw, or the
 * credential only fails as "not valid yet" within `ISSUANCE_SKEW_MS`), so it must be
 * evaluated again later.
 */
export type TranscriptCandidateResult = 'match' | 'reject' | 'retry';

// Session-scoped state, deliberately module-level so it survives remounts of the
// card (WalletPage and SchoolConnect both mount it) for the life of the app session,
// and is shared by every mounted instance and the notification deep link.
const pollWindowStartedAt = new Map<string, number>();
const rejectedUrisByRequest = new Map<string, Set<string>>();

const getRejectedUris = (requestId: string): Set<string> => {
    let rejected = rejectedUrisByRequest.get(requestId);
    if (!rejected) {
        rejected = new Set();
        rejectedUrisByRequest.set(requestId, rejected);
    }
    return rejected;
};

/**
 * localStorage key flagging a transcript that was claimed but whose "mark received"
 * acknowledgement has not yet succeeded. `useTranscriptArrival` retries any such
 * acknowledgement (without claiming again) the next time it runs for the request.
 */
export const getTranscriptPendingReceivedKey = (userDid: string, requestId: string): string =>
    `transcript_pending_received:${userDid}:${requestId}`;

/** Test-only: clears the per-session polling window, rejection and claim state. */
export const resetTranscriptArrivalSessionState = (): void => {
    pollWindowStartedAt.clear();
    rejectedUrisByRequest.clear();
    resetTranscriptClaims();
};

const getIssuerId = (vc: VC): string | undefined => {
    const issuer = vc.issuer as string | { id?: string } | undefined;
    return typeof issuer === 'string' ? issuer : issuer?.id;
};

const REQUEST_ID_KEYS = ['requestId', 'request_id'] as const;
const URN_UUID_PREFIX = 'urn:uuid:';

const readRequestIds = (value: unknown): string[] => {
    if (!value || typeof value !== 'object') return [];
    const record = value as Record<string, unknown>;
    return REQUEST_ID_KEYS.map(key => record[key]).filter(
        (id): id is string => typeof id === 'string' && id.length > 0
    );
};

const readEvidenceUrnId = (value: unknown): string[] => {
    if (!value || typeof value !== 'object') return [];
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' &&
        id.startsWith(URN_UUID_PREFIX) &&
        id.length > URN_UUID_PREFIX.length
        ? [id.slice(URN_UUID_PREFIX.length)]
        : [];
};

/**
 * Request IDs the issuer echoed back on the credential, if any. The partner
 * contract (docs/apps/learn-card-app/transcript-request.md) has the issuer add a
 * top-level `evidence` entry whose `id` is `urn:uuid:<request_id>`; explicit
 * `requestId` / `request_id` fields on `credentialSubject` or an `evidence` entry
 * are accepted too. Echoing is optional while issuers adopt it.
 */
export const getEchoedRequestIds = (vc: VC): string[] => {
    const subjects = Array.isArray(vc.credentialSubject)
        ? vc.credentialSubject
        : [vc.credentialSubject];
    const evidence = (vc as { evidence?: unknown }).evidence;
    const evidenceEntries = Array.isArray(evidence) ? evidence : evidence ? [evidence] : [];

    return [
        ...subjects.flatMap(readRequestIds),
        ...evidenceEntries.flatMap(readRequestIds),
        ...evidenceEntries.flatMap(readEvidenceUrnId),
    ];
};

export type EvaluateTranscriptCandidateParams = {
    vc: VC;
    /**
     * The LearnCard Network profile ID that sent the credential: `from` on an incoming
     * credential, or `from.profileId` on a notification. Never a DID: the network rewrites
     * every profile's DID to its own `did:web:<network>:users:<profileId>`, so a profile DID
     * cannot be compared with the issuer's signing DID.
     */
    senderProfileId: string | undefined;
    /** The issuer's configured network profile ID (`transcriptsGetStatus().issuerProfileId`). */
    expectedSenderProfileId: string;
    /** The DID the issuer signs with; the credential's own `issuer` must equal it. */
    expectedIssuerDid: string;
    userDid: string;
    requestedAt: string;
    /** The active request; when the issuer echoed a request ID it must equal this. */
    expectedRequestId?: string;
    wallet: BespokeLearnCard;
};

/**
 * The single, tested rule set for deciding whether an incoming credential is the
 * transcript a student asked for. The sender profile check is mandatory (network sends
 * are authenticated, so it cannot be spoofed); the credential's own `issuer` must
 * also be the expected issuer — in addition to, never instead of, the sender check.
 * Verification runs last; failing it is a non-match and the credential is left for
 * manual review, never shown or saved as if it were valid.
 */
export const evaluateTranscriptCandidate = async ({
    vc,
    senderProfileId,
    expectedSenderProfileId,
    expectedIssuerDid,
    userDid,
    requestedAt,
    expectedRequestId,
    wallet,
}: EvaluateTranscriptCandidateParams): Promise<TranscriptCandidateResult> => {
    if (!expectedSenderProfileId || senderProfileId !== expectedSenderProfileId) return 'reject';
    if (!expectedIssuerDid) return 'reject';
    if (getIssuerId(vc) !== expectedIssuerDid) return 'reject';
    if (!vc.type?.includes('ClrCredential')) return 'reject';

    const subject = Array.isArray(vc.credentialSubject)
        ? vc.credentialSubject[0]
        : vc.credentialSubject;
    if (subject?.id !== userDid) return 'reject';

    const issuedAt = vc.validFrom ?? vc.issuanceDate;
    const issuedAtMs = issuedAt ? new Date(issuedAt).getTime() : NaN;
    if (
        Number.isNaN(issuedAtMs) ||
        issuedAtMs < new Date(requestedAt).getTime() - ISSUANCE_SKEW_MS
    ) {
        return 'reject';
    }

    const echoedRequestIds = getEchoedRequestIds(vc);
    if (
        expectedRequestId &&
        echoedRequestIds.length > 0 &&
        !echoedRequestIds.includes(expectedRequestId)
    ) {
        return 'reject';
    }

    try {
        const verification = await wallet.invoke.verifyCredential(vc);
        const problems = [...(verification?.warnings ?? []), ...(verification?.errors ?? [])];
        if (problems.length > 0) {
            // The device clock is slightly behind the issuer's: the credential becomes
            // valid shortly, so decide again later instead of rejecting it for good.
            const becomesValidSoon =
                vc.validFrom !== undefined &&
                new Date(vc.validFrom).getTime() - Date.now() <= ISSUANCE_SKEW_MS;
            if (becomesValidSoon && problems.every(problem => problem === NOT_VALID_YET_ERROR)) {
                return 'retry';
            }
            return 'reject';
        }
    } catch (error) {
        log.warn('transcript-arrival.verify.failed', error);
        return 'retry';
    }

    return 'match';
};

/**
 * Boolean form of `evaluateTranscriptCandidate` for one-shot callers (e.g. a
 * notification tap). A transient verification failure counts as no match.
 */
export const isMatchingTranscript = async (
    params: EvaluateTranscriptCandidateParams
): Promise<boolean> => (await evaluateTranscriptCandidate(params)) === 'match';

export type UseTranscriptArrivalParams = {
    status: TranscriptRequestStatus;
    /** DID the issuer signs transcripts with. */
    issuerDid: string | undefined;
    /** LearnCard Network profile ID the issuer sends transcripts from. */
    issuerProfileId: string | undefined;
    requestId: string | undefined;
    requestedAt: string | undefined;
    receivedAt: string | undefined;
};

export type UseTranscriptArrivalResult = {
    /**
     * True once this request was polled for the whole `POLL_WINDOW_MS` this session
     * without a match. The transcript may still have arrived (and be waiting in
     * notifications / incoming credentials), so callers should offer a manual path.
     */
    isPollingExhausted: boolean;
    /** Restarts the polling window, forgets cached rejections, and re-checks now. */
    checkAgain: () => void;
};

/**
 * Watches for the transcript a student requested and auto-accepts it the moment it
 * matches, so there is no separate "accept" decision for something already asked
 * for. Active only while a request is outstanding (`status === 'requested'` and no
 * `receivedAt` yet). While the page is visible it polls `getIncomingCredentials`
 * with exponential backoff (5s doubling to a 60s cap) and stops after
 * `POLL_WINDOW_MS` per app session. Refetches on app foreground/resume and on any
 * `CREDENTIAL_RECEIVED` push received in the foreground. Credentials already
 * rejected for a request are never re-read. Never accepts more than one credential
 * per request, across every mounted instance (see `claimTranscriptOnce`). A matching
 * transcript the student already accepted by hand (it is no longer incoming) is found
 * via `getReceivedCredentials` and only acknowledged, never claimed again; if its wallet
 * index entry is still missing on a later check (network accept succeeded, wallet write
 * failed) it is re-added first, and the request is acknowledged only once the
 * transcript is in the wallet.
 */
export const useTranscriptArrival = ({
    status,
    issuerDid,
    issuerProfileId,
    requestId,
    requestedAt,
    receivedAt,
}: UseTranscriptArrivalParams): UseTranscriptArrivalResult => {
    const { initWallet, addVCtoWallet } = useWallet();
    const queryClient = useQueryClient();
    const { track } = useAnalytics();
    // useWallet/useAnalytics return new functions every render; keep them out of the
    // check's dependencies so it only re-runs when its inputs change.
    const depsRef = useRef({ initWallet, addVCtoWallet, track });
    depsRef.current = { initWallet, addVCtoWallet, track };
    const hasAcceptedRef = useRef(false);
    const pendingMarkRef = useRef<string>();
    const busyRef = useRef(false);
    /** A check was requested while one was running; run it again with the latest inputs. */
    const rerunRef = useRef(false);
    const checkCredentialsRef = useRef<() => Promise<void>>(async () => undefined);
    const retryRef = useRef({ delay: INITIAL_POLL_MS, at: 0 });
    /**
     * When an accepted transcript's wallet entry was first seen missing, by URI. A hand
     * claim (e.g. the generic claim modal) accepts on the network before its own wallet
     * write lands, so a single miss is not proof the write failed.
     */
    const walletMissAtRef = useRef(new Map<string, number>());
    const [isVisible, setIsVisible] = useState(
        typeof document === 'undefined' ? true : document.visibilityState === 'visible'
    );
    const [isPollingExhausted, setIsPollingExhausted] = useState(false);
    const [pollGeneration, setPollGeneration] = useState(0);

    const isActive = Boolean(
        status === 'requested' &&
        !receivedAt &&
        issuerDid &&
        issuerProfileId &&
        requestId &&
        requestedAt
    );

    const { data: incomingCredentials, refetch } = useGetIncomingCredentials(isActive);

    // A new request means a fresh credential may legitimately arrive again.
    useEffect(() => {
        hasAcceptedRef.current = false;
        retryRef.current = { delay: INITIAL_POLL_MS, at: 0 };
        setIsPollingExhausted(false);
    }, [requestId]);

    useEffect(() => {
        const handleVisibilityChange = (): void => {
            setIsVisible(document.visibilityState === 'visible');
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const checkCredentials = useCallback(async (): Promise<void> => {
        if (!isActive) return;
        // Never drop a request made mid-check (e.g. a refetch delivering a new incoming
        // list while a foreground re-check runs): queue one rerun of the latest closure.
        if (busyRef.current) {
            rerunRef.current = true;
            return;
        }
        if (Date.now() < retryRef.current.at) return;
        if (!issuerDid || !issuerProfileId || !requestId || !requestedAt) return;

        busyRef.current = true;
        try {
            const {
                initWallet: loadWallet,
                addVCtoWallet: addToWallet,
                track: trackEvent,
            } = depsRef.current;
            const wallet = await loadWallet();
            const userDid = wallet.id.did();
            const storageKey = getTranscriptPendingReceivedKey(userDid, requestId);
            const persistPending = (pending: boolean): void => {
                try {
                    if (pending) localStorage.setItem(storageKey, 'true');
                    else localStorage.removeItem(storageKey);
                } catch (error) {
                    log.warn('transcript-arrival.pending-storage.failed', error);
                }
            };
            try {
                if (localStorage.getItem(storageKey)) pendingMarkRef.current = requestId;
            } catch (error) {
                log.warn('transcript-arrival.pending-storage.failed', error);
            }
            /**
             * Makes sure the transcript is in the wallet index, re-adding it (which re-runs
             * managed verification) when a network accept outlived a failed wallet write.
             *
             * With `confirmMiss`, a missing entry is only re-added once it is still missing
             * at least `INITIAL_POLL_MS` after it was first seen missing; until then this
             * throws so the check is retried with backoff. That keeps a hand claim whose
             * network accept finished before its wallet write from being saved twice.
             */
            const ensureInWallet = async (
                uri: string,
                { confirmMiss = false }: { confirmMiss?: boolean } = {}
            ): Promise<void> => {
                const records = await wallet.index.LearnCloud.get({ uri }, { cache: 'skip-cache' });
                if (records && records.length > 0) {
                    walletMissAtRef.current.delete(uri);
                    return;
                }
                if (confirmMiss) {
                    const firstMissAt = walletMissAtRef.current.get(uri);
                    if (firstMissAt === undefined) {
                        walletMissAtRef.current.set(uri, Date.now());
                        throw new Error('The transcript is not in the wallet yet');
                    }
                    if (Date.now() - firstMissAt < INITIAL_POLL_MS) {
                        throw new Error('The transcript is not in the wallet yet');
                    }
                }
                log.warn('transcript-arrival.wallet-entry.missing');
                const added = await addToWallet({ uri });
                if (!added) throw new Error('The transcript could not be added to the wallet');
            };
            const markReceived = async (): Promise<void> => {
                await wallet.invoke.transcriptsMarkReceived({ requestId });
                pendingMarkRef.current = undefined;
                persistPending(false);
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['incomingCredentials'] }),
                    queryClient.invalidateQueries({ queryKey: ['transcriptStatus'] }),
                    queryClient.invalidateQueries({ queryKey: ['useGetCredentials'] }),
                ]);
                void trackEvent(AnalyticsEvents.TRANSCRIPT_ARRIVED, {});
            };
            if (pendingMarkRef.current === requestId) {
                hasAcceptedRef.current = true;
                await markReceived();
                return;
            }
            if (hasAcceptedRef.current) return;

            const rejected = getRejectedUris(requestId);

            for (const credInfo of incomingCredentials ?? []) {
                // Another instance (or the notification deep link) is claiming or has
                // claimed it; if that claim fails it is forgotten and this loop retries.
                if (hasAcceptedRef.current || isTranscriptClaimStarted(requestId)) break;
                if (rejected.has(credInfo.uri)) continue;
                // `from` is the sender's network profileId (or an app listing ID). Only the
                // issuer's configured profile qualifies; no lookup, no credential read.
                if (credInfo.from !== issuerProfileId) {
                    rejected.add(credInfo.uri);
                    continue;
                }

                try {
                    const vc = await wallet.read.get(credInfo.uri);
                    if (!vc) continue;

                    const result = await evaluateTranscriptCandidate({
                        vc: vc as VC,
                        senderProfileId: credInfo.from,
                        expectedSenderProfileId: issuerProfileId,
                        expectedIssuerDid: issuerDid,
                        userDid,
                        requestedAt,
                        expectedRequestId: requestId,
                        wallet,
                    });
                    if (result === 'reject') rejected.add(credInfo.uri);
                    if (result !== 'match') continue;

                    hasAcceptedRef.current = true;
                    log.info('transcript-arrival.match.found');

                    let claimedHere: boolean;
                    try {
                        claimedHere = await claimTranscriptOnce(requestId, async () => {
                            const { added } = await claimIncomingCredential({
                                uri: credInfo.uri,
                                wallet,
                                addVCtoWallet: addToWallet,
                                queryClient,
                            });
                            // The write reported nothing added without throwing: confirm
                            // the entry exists (or add it) before acknowledging.
                            if (!added) await ensureInWallet(credInfo.uri);
                            storeTranscriptReceipt(userDid, requestId, credInfo.uri);
                        });
                    } catch (error) {
                        hasAcceptedRef.current = false;
                        throw error;
                    }
                    // Claimed elsewhere: that caller acknowledges it (or leaves the
                    // pending flag, which this hook retries).
                    if (!claimedHere) break;
                    pendingMarkRef.current = requestId;
                    persistPending(true);
                    await markReceived();
                    break;
                } catch (error) {
                    log.error('transcript-arrival.check.failed', error);
                    if (pendingMarkRef.current === requestId) throw error;
                }
            }

            // A transcript claimed by hand (notifications list, generic claim modal) is
            // accepted on the network and leaves the incoming list without anyone
            // acknowledging the request. Look for it among the credentials already
            // accepted from the issuer and acknowledge it here, whichever path claimed
            // it. Skipped while (or after) a claim this session owns the acknowledgement.
            if (hasAcceptedRef.current || isTranscriptClaimStarted(requestId)) return;
            try {
                const received = await wallet.invoke.getReceivedCredentials(issuerProfileId);
                const earliestSentAt = new Date(requestedAt).getTime() - ISSUANCE_SKEW_MS;
                for (const credInfo of received ?? []) {
                    if (hasAcceptedRef.current || isTranscriptClaimStarted(requestId)) break;
                    if (rejected.has(credInfo.uri)) continue;
                    if (
                        credInfo.from !== issuerProfileId ||
                        new Date(credInfo.sent).getTime() < earliestSentAt
                    ) {
                        rejected.add(credInfo.uri);
                        continue;
                    }

                    const vc = await wallet.read.get(credInfo.uri);
                    if (!vc) continue;

                    const result = await evaluateTranscriptCandidate({
                        vc: vc as VC,
                        senderProfileId: credInfo.from,
                        expectedSenderProfileId: issuerProfileId,
                        expectedIssuerDid: issuerDid,
                        userDid,
                        requestedAt,
                        expectedRequestId: requestId,
                        wallet,
                    });
                    if (result === 'reject') rejected.add(credInfo.uri);
                    if (result !== 'match') continue;

                    log.info('transcript-arrival.accepted-elsewhere.found');
                    hasAcceptedRef.current = true;
                    // Accepted on the network is not the same as saved: a claim whose
                    // network accept succeeded but whose wallet write failed lands here
                    // too, and the received card only reads the wallet index. Restore the
                    // entry first (single-flight, like a claim) and acknowledge only once
                    // it is in the wallet; a failed restore is retried with backoff. A
                    // first miss only schedules a re-check: a hand claim still writing
                    // its entry must not be raced into a duplicate wallet record.
                    let restoredHere: boolean;
                    try {
                        restoredHere = await claimTranscriptOnce(requestId, async () => {
                            await ensureInWallet(credInfo.uri, { confirmMiss: true });
                            storeTranscriptReceipt(userDid, requestId, credInfo.uri);
                        });
                    } catch (error) {
                        hasAcceptedRef.current = false;
                        throw new TranscriptWalletRestoreError(error);
                    }
                    if (!restoredHere) break;
                    pendingMarkRef.current = requestId;
                    persistPending(true);
                    await markReceived();
                    break;
                }
            } catch (error) {
                if (
                    pendingMarkRef.current === requestId ||
                    error instanceof TranscriptWalletRestoreError
                ) {
                    throw error;
                }
                log.warn('transcript-arrival.received-check.failed', error);
            }
        } catch (error) {
            retryRef.current.at = Date.now() + retryRef.current.delay;
            retryRef.current.delay = Math.min(retryRef.current.delay * 2, MAX_POLL_MS);
            log.error('transcript-arrival.retry.pending', error);
        } finally {
            busyRef.current = false;
            if (rerunRef.current) {
                rerunRef.current = false;
                void checkCredentialsRef.current();
            }
        }
    }, [
        isActive,
        incomingCredentials,
        issuerDid,
        issuerProfileId,
        requestId,
        requestedAt,
        queryClient,
    ]);

    checkCredentialsRef.current = checkCredentials;

    useEffect(() => {
        void checkCredentials();
    }, [checkCredentials]);

    // Bounded backoff polling. Each tick refetches incoming credentials and also
    // re-runs the check directly, so a failed "mark received" acknowledgement is
    // retried even once the claimed credential is no longer incoming.
    useEffect(() => {
        if (!isActive || !isVisible || !requestId) return;

        const startedAt = pollWindowStartedAt.get(requestId) ?? Date.now();
        pollWindowStartedAt.set(requestId, startedAt);

        let cancelled = false;
        let delay = INITIAL_POLL_MS;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const schedule = (): void => {
            const remaining = POLL_WINDOW_MS - (Date.now() - startedAt);
            if (remaining <= 0) {
                setIsPollingExhausted(true);
                return;
            }
            timer = setTimeout(tick, Math.min(delay, remaining));
        };

        const tick = (): void => {
            if (cancelled) return;
            void refetch();
            void checkCredentialsRef.current();
            delay = Math.min(delay * 2, MAX_POLL_MS);
            schedule();
        };

        schedule();

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    }, [isActive, isVisible, requestId, refetch, pollGeneration]);

    // Refetch on app foreground/resume and on a foreground CREDENTIAL_RECEIVED push.
    // These are event-driven (not timers), so they stay on after the polling window.
    useEffect(() => {
        if (!isActive) return;

        let disposed = false;
        let appStateHandle: PluginListenerHandle | undefined;
        let pushHandle: PluginListenerHandle | undefined;

        App.addListener('appStateChange', ({ isActive: appIsActive }) => {
            if (appIsActive) {
                void refetch();
                // Also re-checks credentials claimed by hand while the app was away.
                void checkCredentialsRef.current();
            }
        })
            .then(handle => {
                if (disposed) void handle.remove();
                else appStateHandle = handle;
            })
            .catch(error => log.warn('transcript-arrival.app-state-listener-failed', error));

        PushNotifications.addListener(
            'pushNotificationReceived',
            (payload: PushNotificationSchema) => {
                const notification = parseForegroundPushNotification(payload);
                if (
                    notification?.type === LCNNotificationTypeEnumValidator.enum.CREDENTIAL_RECEIVED
                ) {
                    void refetch();
                }
            }
        )
            .then(handle => {
                if (disposed) void handle.remove();
                else pushHandle = handle;
            })
            .catch(error => log.warn('transcript-arrival.push-listener-failed', error));

        return () => {
            disposed = true;
            if (appStateHandle) void appStateHandle.remove();
            if (pushHandle) void pushHandle.remove();
        };
    }, [isActive, refetch]);

    const checkAgain = useCallback((): void => {
        if (!requestId) return;
        pollWindowStartedAt.delete(requestId);
        rejectedUrisByRequest.delete(requestId);
        retryRef.current = { delay: INITIAL_POLL_MS, at: 0 };
        setIsPollingExhausted(false);
        setPollGeneration(generation => generation + 1);
        void refetch();
        void checkCredentialsRef.current();
    }, [requestId, refetch]);

    return { isPollingExhausted, checkAgain };
};
