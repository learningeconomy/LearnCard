/**
 * useQrLogin — shared React hooks for QR-based cross-device login.
 *
 * Two hooks:
 *   - useQrLoginRequester  (Device B — the new device wanting to log in)
 *   - useQrLoginApprover   (Device A — the logged-in device granting access)
 *
 * Both hooks are framework-agnostic (no Ionic, no app-specific deps) so they
 * can be used from learn-card-app, scouts, or any future app.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

import {
    createQrLoginSession,
    pollUntilApproved,
    getQrLoginSessionInfo,
    approveQrLoginSession,
    notifyDevicesForQrSession,
} from '@learncard/sss-key-manager';

import type {
    QrLoginSession,
    QrPayload,
    QrLoginSessionInfo,
} from '@learncard/sss-key-manager';

// ---------------------------------------------------------------------------
// Requester Hook (Device B — the new device)
// ---------------------------------------------------------------------------

export type QrRequesterStatus =
    | 'idle'
    | 'creating'
    | 'waiting'
    | 'approved'
    | 'expired'
    | 'error';

export interface QrRequesterState {
    status: QrRequesterStatus;
    session: QrLoginSession | null;
    qrPayload: QrPayload | null;
    shortCode: string | null;
    secondsRemaining: number;
    deviceShare: string | null;
    approverDid: string | null;
    error: string | null;
}

export interface UseQrLoginRequesterReturn extends QrRequesterState {
    /** Start a new QR login session (creates session + keypair + begins polling) */
    start: () => Promise<void>;

    /** Cancel the current session and reset */
    cancel: () => void;

    /** Restart (cancel + start) */
    restart: () => Promise<void>;
}

/**
 * Optional auth credentials for sending push notifications to other devices.
 * When provided, the hook will fire-and-forget a push notification after
 * creating a session, prompting Device A to open the approver flow.
 */
export interface QrRequesterNotifyAuth {
    authToken: string;
    providerType?: string;
}

export const useQrLoginRequester = (
    serverUrl: string,
    notifyAuth?: QrRequesterNotifyAuth
): UseQrLoginRequesterReturn => {
    const [state, setState] = useState<QrRequesterState>({
        status: 'idle',
        session: null,
        qrPayload: null,
        shortCode: null,
        secondsRemaining: 0,
        deviceShare: null,
        approverDid: null,
        error: null,
    });

    const abortRef = useRef<AbortController | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const ephemeralKeyRef = useRef<CryptoKey | null>(null);
    const notifyAuthRef = useRef(notifyAuth);
    notifyAuthRef.current = notifyAuth;

    const cleanup = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        ephemeralKeyRef.current = null;
    }, []);

    // Cleanup on unmount
    useEffect(() => cleanup, [cleanup]);

    const cancel = useCallback(() => {
        cleanup();

        setState({
            status: 'idle',
            session: null,
            qrPayload: null,
            shortCode: null,
            secondsRemaining: 0,
            deviceShare: null,
            approverDid: null,
            error: null,
        });
    }, [cleanup]);

    const start = useCallback(async () => {
        cleanup();

        setState(prev => ({ ...prev, status: 'creating', error: null }));

        try {
            const { session, ephemeralKeypair, qrPayload } = await createQrLoginSession({
                serverUrl,
            });

            ephemeralKeyRef.current = ephemeralKeypair.privateKey;

            const abortController = new AbortController();
            abortRef.current = abortController;

            // Start countdown timer
            let remaining = session.expiresInSeconds;

            setState({
                status: 'waiting',
                session,
                qrPayload,
                shortCode: session.shortCode,
                secondsRemaining: remaining,
                deviceShare: null,
                approverDid: null,
                error: null,
            });

            // Fire-and-forget: send push notification to other devices
            const currentNotifyAuth = notifyAuthRef.current;

            if (currentNotifyAuth?.authToken) {
                notifyDevicesForQrSession(
                    { serverUrl },
                    session.sessionId,
                    session.shortCode,
                    currentNotifyAuth.authToken,
                    currentNotifyAuth.providerType ?? 'firebase'
                ).catch(() => { /* non-fatal */ });
            }

            timerRef.current = setInterval(() => {
                remaining -= 1;

                if (remaining <= 0) {
                    if (timerRef.current) clearInterval(timerRef.current);

                    setState(prev => ({
                        ...prev,
                        secondsRemaining: 0,
                        status: prev.status === 'waiting' ? 'expired' : prev.status,
                    }));

                    return;
                }

                setState(prev => ({ ...prev, secondsRemaining: remaining }));
            }, 1000);

            // Start polling
            const result = await pollUntilApproved(
                { serverUrl },
                session.sessionId,
                ephemeralKeypair.privateKey,
                {
                    intervalMs: 2000,
                    timeoutMs: session.expiresInSeconds * 1000,
                    signal: abortController.signal,
                }
            );

            // Polling succeeded — device share received
            if (timerRef.current) clearInterval(timerRef.current);

            setState(prev => ({
                ...prev,
                status: 'approved',
                deviceShare: result.deviceShare,
                approverDid: result.approverDid,
            }));
        } catch (e) {
            if (timerRef.current) clearInterval(timerRef.current);

            const message = e instanceof Error ? e.message : 'Unknown error';

            // Don't overwrite state if we were cancelled
            if (message.includes('aborted')) return;

            setState(prev => ({
                ...prev,
                status: message.includes('timed out') ? 'expired' : 'error',
                error: message,
            }));
        }
    }, [serverUrl, cleanup]);

    const restart = useCallback(async () => {
        cancel();
        await start();
    }, [cancel, start]);

    return {
        ...state,
        start,
        cancel,
        restart,
    };
};

// ---------------------------------------------------------------------------
// Approver Hook (Device A — the logged-in device)
// ---------------------------------------------------------------------------

export type QrApproverStatus =
    | 'idle'
    | 'loading'
    | 'confirming'
    | 'approving'
    | 'done'
    | 'error';

export interface QrApproverState {
    status: QrApproverStatus;
    sessionInfo: QrLoginSessionInfo | null;
    error: string | null;
}

export interface UseQrLoginApproverReturn extends QrApproverState {
    /** Look up a session by ID or short code (from QR scan or manual entry) */
    lookupSession: (lookup: string) => Promise<void>;

    /** Approve the current session — encrypts and pushes the device share */
    approve: (deviceShare: string, approverDid: string) => Promise<void>;

    /** Reset the approver state */
    reset: () => void;
}

export const useQrLoginApprover = (serverUrl: string): UseQrLoginApproverReturn => {
    const [state, setState] = useState<QrApproverState>({
        status: 'idle',
        sessionInfo: null,
        error: null,
    });

    const lookupSession = useCallback(async (lookup: string) => {
        setState({ status: 'loading', sessionInfo: null, error: null });

        try {
            const info = await getQrLoginSessionInfo({ serverUrl }, lookup);

            setState({
                status: 'confirming',
                sessionInfo: info,
                error: null,
            });
        } catch (e) {
            setState({
                status: 'error',
                sessionInfo: null,
                error: e instanceof Error ? e.message : 'Session not found or expired',
            });
        }
    }, [serverUrl]);

    const approve = useCallback(async (deviceShare: string, approverDid: string) => {
        if (!state.sessionInfo) {
            setState(prev => ({ ...prev, status: 'error', error: 'No session loaded' }));
            return;
        }

        setState(prev => ({ ...prev, status: 'approving' }));

        try {
            await approveQrLoginSession(
                { serverUrl },
                state.sessionInfo.sessionId,
                deviceShare,
                approverDid,
                state.sessionInfo.publicKey
            );

            setState(prev => ({ ...prev, status: 'done' }));
        } catch (e) {
            setState(prev => ({
                ...prev,
                status: 'error',
                error: e instanceof Error ? e.message : 'Failed to approve session',
            }));
        }
    }, [serverUrl, state.sessionInfo]);

    const reset = useCallback(() => {
        setState({ status: 'idle', sessionInfo: null, error: null });
    }, []);

    return {
        ...state,
        lookupSession,
        approve,
        reset,
    };
};
