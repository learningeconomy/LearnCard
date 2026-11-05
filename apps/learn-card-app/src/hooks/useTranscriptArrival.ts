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

const log = getLogger('transcript-arrival');

const FAST_POLL_MS = 5_000;
const SLOW_POLL_MS = 60_000;
const FAST_POLL_WINDOW_MS = 60_000;
const STOP_POLLING_AFTER_MS = 15 * 60_000;

export type TranscriptRequestStatus = 'requested' | 'none_yet' | 'failed' | undefined;

/**
 * The single, tested rule set for deciding whether an incoming credential is the
 * transcript a student asked for. A spoofed sender cannot pass the DID check because
 * network sends are authenticated; every other check narrows further. Verification
 * runs last and failing it is treated the same as a non-match — the credential is
 * left for manual review, never shown or saved as if it were valid.
 */
export const isMatchingTranscript = async (
    vc: VC,
    senderDid: string | undefined,
    expectedIssuerDid: string,
    userDid: string,
    requestedAt: string,
    wallet: BespokeLearnCard
): Promise<boolean> => {
    if (!senderDid || senderDid !== expectedIssuerDid) return false;
    if (!vc.type?.includes('ClrCredential')) return false;

    const subject = Array.isArray(vc.credentialSubject)
        ? vc.credentialSubject[0]
        : vc.credentialSubject;
    if (subject?.id !== userDid) return false;

    const issuedAt = vc.validFrom ?? vc.issuanceDate;
    if (!issuedAt || new Date(issuedAt).getTime() < new Date(requestedAt).getTime()) return false;

    try {
        const verification = await wallet.invoke.verifyCredential(vc);
        if ((verification?.warnings?.length ?? 0) > 0 || (verification?.errors?.length ?? 0) > 0) {
            return false;
        }
    } catch (error) {
        log.warn('transcript-arrival.verify.failed', error);
        return false;
    }

    return true;
};

export type UseTranscriptArrivalParams = {
    status: TranscriptRequestStatus;
    issuerDid: string | undefined;
    requestId: string | undefined;
    requestedAt: string | undefined;
    receivedAt: string | undefined;
};

/**
 * Watches for the transcript a student requested and auto-accepts it the moment it
 * matches, so there is no separate "accept" decision for something already asked
 * for. Active only while a request is outstanding (`status === 'requested'` and no
 * `receivedAt` yet); polls `getIncomingCredentials` while the page is visible, 5s
 * for the first minute then backing off to 60s, stopping after 15 minutes. Refetches
 * on app foreground/resume and on any `CREDENTIAL_RECEIVED` push received while the
 * app is in the foreground. Never accepts more than one credential per request.
 */
export const useTranscriptArrival = ({
    status,
    issuerDid,
    requestId,
    requestedAt,
    receivedAt,
}: UseTranscriptArrivalParams): void => {
    const { initWallet, addVCtoWallet } = useWallet();
    const queryClient = useQueryClient();
    const { track } = useAnalytics();
    const hasAcceptedRef = useRef(false);
    const pollStartedAtRef = useRef<number | null>(null);
    const [isVisible, setIsVisible] = useState(
        typeof document === 'undefined' ? true : document.visibilityState === 'visible'
    );

    const isActive = Boolean(
        status === 'requested' && !receivedAt && issuerDid && requestId && requestedAt
    );

    const { data: incomingCredentials, refetch } = useGetIncomingCredentials(isActive);

    // A new request means a fresh credential may legitimately arrive again.
    useEffect(() => {
        hasAcceptedRef.current = false;
    }, [requestId]);

    useEffect(() => {
        const handleVisibilityChange = (): void => {
            setIsVisible(document.visibilityState === 'visible');
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const checkCredentials = useCallback(async (): Promise<void> => {
        if (!isActive || hasAcceptedRef.current) return;
        if (!incomingCredentials?.length) return;
        if (!issuerDid || !requestId || !requestedAt) return;

        const wallet = await initWallet();
        const userDid = wallet.id.did();

        for (const credInfo of incomingCredentials) {
            if (hasAcceptedRef.current) break;

            try {
                const vc = await wallet.read.get(credInfo.uri);
                if (!vc) continue;

                const matches = await isMatchingTranscript(
                    vc as VC,
                    credInfo.from,
                    issuerDid,
                    userDid,
                    requestedAt,
                    wallet
                );
                if (!matches) continue;

                hasAcceptedRef.current = true;
                log.info('transcript-arrival.match.found');

                await claimIncomingCredential({
                    uri: credInfo.uri,
                    wallet,
                    addVCtoWallet,
                    queryClient,
                });
                await wallet.invoke.transcriptsMarkReceived({ requestId });
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['incomingCredentials'] }),
                    queryClient.invalidateQueries({ queryKey: ['transcriptStatus'] }),
                    queryClient.invalidateQueries({ queryKey: ['useGetCredentials'] }),
                ]);
                void track(AnalyticsEvents.TRANSCRIPT_ARRIVED, {});
                break;
            } catch (error) {
                log.error('transcript-arrival.check.failed', error);
            }
        }
    }, [
        isActive,
        incomingCredentials,
        issuerDid,
        requestId,
        requestedAt,
        initWallet,
        addVCtoWallet,
        queryClient,
        track,
    ]);

    useEffect(() => {
        void checkCredentials();
    }, [checkCredentials]);

    // Backoff polling: 5s for the first minute, then 60s, stopping after 15 minutes.
    useEffect(() => {
        if (!isActive || !isVisible) {
            pollStartedAtRef.current = null;
            return;
        }
        if (pollStartedAtRef.current === null) pollStartedAtRef.current = Date.now();

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;

        const tick = (): void => {
            if (cancelled) return;
            const elapsed = Date.now() - (pollStartedAtRef.current ?? Date.now());
            if (elapsed >= STOP_POLLING_AFTER_MS) return;

            void refetch();
            const nextDelay = elapsed < FAST_POLL_WINDOW_MS ? FAST_POLL_MS : SLOW_POLL_MS;
            timer = setTimeout(tick, nextDelay);
        };

        timer = setTimeout(tick, FAST_POLL_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [isActive, isVisible, refetch]);

    // Refetch on app foreground/resume and on a foreground CREDENTIAL_RECEIVED push.
    useEffect(() => {
        if (!isActive) return;

        let disposed = false;
        let appStateHandle: PluginListenerHandle | undefined;
        let pushHandle: PluginListenerHandle | undefined;

        App.addListener('appStateChange', ({ isActive: appIsActive }) => {
            if (appIsActive) void refetch();
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
};
