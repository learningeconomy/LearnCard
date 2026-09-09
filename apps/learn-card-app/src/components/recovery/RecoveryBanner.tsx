import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, closeOutline, shieldOutline } from 'ionicons/icons';

import { isPublicComputerMode, isWebAuthnSupported } from '@learncard/sss-key-manager';
import firstStartupStore, {
    RECOVERY_PROMPT_SNOOZE_MS,
} from 'learn-card-base/stores/firstStartupStore';

import { AnalyticsEvents, useAnalytics } from '@analytics';

import * as m from '../../paraglide/messages.js';
import type { RecoverySetupType } from './RecoverySetupModal';

const SUCCESS_DURATION_MS = 4000;
const EXIT_DURATION_MS = 300;

type RecoveryPromptWeight = 'calm' | 'urgent';
type RecoveryPromptPhase = 'visible' | 'success' | 'exiting' | 'hidden';

interface RecoveryBannerProps {
    recoverySupported: boolean;
    recoveryMethodCount: number | null;
    totalCredentialCount: number;
    onSetup: (options: {
        initialMethod: RecoverySetupType;
        onCompleted: (method: RecoverySetupType) => void;
        onClosed: () => void;
    }) => void;
}

export const RecoveryBanner: React.FC<RecoveryBannerProps> = ({
    recoverySupported,
    recoveryMethodCount,
    totalCredentialCount,
    onSetup,
}) => {
    const { track } = useAnalytics();
    const isPublic = isPublicComputerMode();
    const snoozedUntil = firstStartupStore.useTracked.recoveryPromptSnoozedUntil();
    const [phase, setPhase] = useState<RecoveryPromptPhase>('visible');
    const [completed, setCompleted] = useState(false);
    const [setupRequested, setSetupRequested] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const shownRef = useRef(false);
    const setupRequestedRef = useRef(false);
    const completionHandledRef = useRef(false);

    const weight: RecoveryPromptWeight = isPublic ? 'urgent' : 'calm';
    const recommendedMethod = useMemo<RecoverySetupType>(
        () => (!Capacitor.isNativePlatform() && isWebAuthnSupported() ? 'passkey' : 'phrase'),
        []
    );
    const isSnoozed = !isPublic && snoozedUntil > currentTime;
    const isEligible =
        recoverySupported &&
        recoveryMethodCount === 0 &&
        (isPublic || totalCredentialCount > 0) &&
        !isSnoozed;
    const isRendered = (!completed && isEligible) || phase === 'success' || phase === 'exiting';

    useEffect(() => {
        if (!isEligible || shownRef.current) return;

        shownRef.current = true;
        track(AnalyticsEvents.DASHBOARD_RECOVERY_PROMPT_INTERACTED, {
            action: 'shown',
            weight,
        });
    }, [isEligible, track, weight]);

    useEffect(() => {
        if (isPublic || snoozedUntil <= currentTime) return;

        const expiryTimer = window.setTimeout(
            () => setCurrentTime(Date.now()),
            snoozedUntil - currentTime
        );

        return () => window.clearTimeout(expiryTimer);
    }, [currentTime, isPublic, snoozedUntil]);

    useEffect(() => {
        if (phase !== 'success') return;

        const successTimer = window.setTimeout(() => setPhase('exiting'), SUCCESS_DURATION_MS);

        return () => window.clearTimeout(successTimer);
    }, [phase]);

    useEffect(() => {
        if (phase !== 'exiting') return;

        const hideTimer = window.setTimeout(() => setPhase('hidden'), EXIT_DURATION_MS);

        return () => window.clearTimeout(hideTimer);
    }, [phase]);

    if (!isRendered) return null;

    const handleSetup = (): void => {
        if (setupRequestedRef.current) return;

        setupRequestedRef.current = true;
        completionHandledRef.current = false;
        setSetupRequested(true);

        track(AnalyticsEvents.DASHBOARD_RECOVERY_PROMPT_INTERACTED, {
            action: 'clicked',
            weight,
            method: recommendedMethod,
        });

        try {
            onSetup({
                initialMethod: recommendedMethod,
                onCompleted: method => {
                    if (completionHandledRef.current) return;

                    completionHandledRef.current = true;
                    track(AnalyticsEvents.DASHBOARD_RECOVERY_PROMPT_INTERACTED, {
                        action: 'completed',
                        weight,
                        method,
                    });
                    setCompleted(true);
                    setPhase('success');
                },
                onClosed: () => {
                    setupRequestedRef.current = false;
                    setSetupRequested(false);
                },
            });
        } catch (error) {
            setupRequestedRef.current = false;
            setSetupRequested(false);
            throw error;
        }
    };

    const handleSnooze = (): void => {
        const nextSnoozedUntil = Date.now() + RECOVERY_PROMPT_SNOOZE_MS;
        setCurrentTime(Date.now());
        firstStartupStore.set.recoveryPromptSnoozedUntil(nextSnoozedUntil);
        shownRef.current = false;
        track(AnalyticsEvents.DASHBOARD_RECOVERY_PROMPT_INTERACTED, {
            action: 'snoozed',
            weight: 'calm',
        });
        setPhase('exiting');
    };

    const isSuccess = completed;
    const isExiting = phase === 'exiting';

    return (
        <div
            data-testid="dashboard-recovery-prompt"
            className={`grid w-full overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${
                isExiting ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
            }`}
        >
            <div className="min-h-0 overflow-hidden">
                {isSuccess ? (
                    <div
                        role="status"
                        aria-live="polite"
                        className="animate-fade-in-up w-full flex items-center gap-3 p-4 rounded-[20px] border border-emerald-100 bg-emerald-50 text-start"
                    >
                        <IonIcon
                            icon={checkmarkCircleOutline}
                            className="text-emerald-600 text-xl shrink-0"
                        />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-emerald-800 leading-tight">
                                {m['recovery.prompt.success.title']()}
                            </p>
                            <p className="text-xs text-emerald-700 leading-snug mt-0.5">
                                {m['recovery.prompt.success.body']()}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div
                        className={`animate-fade-in-up w-full flex items-stretch rounded-[20px] border transition-colors ${
                            isPublic
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-white border-grayscale-200'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={handleSetup}
                            disabled={setupRequested}
                            aria-label={m['recovery.prompt.openAria']()}
                            className="group flex-1 min-w-0 flex items-center gap-3 p-4 text-start rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-wait"
                        >
                            <span
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                    isPublic
                                        ? 'bg-amber-100 group-hover:bg-amber-200'
                                        : 'bg-amber-50 group-hover:bg-amber-100'
                                }`}
                            >
                                <IonIcon icon={shieldOutline} className="text-amber-600 text-lg" />
                            </span>

                            <span className="flex-1 min-w-0">
                                <span
                                    className={`block text-sm font-semibold leading-tight ${
                                        isPublic ? 'text-amber-900' : 'text-grayscale-900'
                                    }`}
                                >
                                    {isPublic
                                        ? m['recovery.prompt.urgent.title']()
                                        : m['recovery.prompt.calm.title']()}
                                </span>
                                <span
                                    className={`block text-xs leading-snug mt-0.5 ${
                                        isPublic ? 'text-amber-800' : 'text-grayscale-600'
                                    }`}
                                >
                                    {isPublic
                                        ? m['recovery.prompt.urgent.body']()
                                        : m['recovery.prompt.calm.body']()}
                                </span>
                                <span
                                    className={`block text-xs font-semibold mt-1 ${
                                        isPublic ? 'text-amber-900' : 'text-grayscale-800'
                                    }`}
                                >
                                    {recommendedMethod === 'passkey'
                                        ? m['recovery.prompt.action.passkey']()
                                        : m['recovery.prompt.action.phrase']()}
                                </span>
                            </span>
                        </button>

                        {!isPublic && (
                            <button
                                type="button"
                                onClick={handleSnooze}
                                aria-label={m['recovery.prompt.snoozeAria']()}
                                className="self-center me-3 p-2 rounded-full text-grayscale-500 hover:text-grayscale-700 hover:bg-grayscale-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
                            >
                                <IonIcon icon={closeOutline} className="text-lg" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecoveryBanner;
