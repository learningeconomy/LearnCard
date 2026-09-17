import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { IonIcon } from '@ionic/react';
import {
    checkmarkCircleOutline,
    closeOutline,
    shieldOutline,
    keypadOutline,
    shieldCheckmarkOutline,
} from 'ionicons/icons';

import { isPublicComputerMode, isWebAuthnSupported } from '@learncard/sss-key-manager';
import firstStartupStore, {
    RECOVERY_PROMPT_SNOOZE_MS,
} from 'learn-card-base/stores/firstStartupStore';

import { AnalyticsEvents, useAnalytics } from '@analytics';

import * as m from '../../paraglide/messages.js';
import type { RecoverySetupType } from './RecoverySetupModal';

const SUCCESS_DURATION_MS = 4000;
const EXIT_DURATION_MS = 300;

type RecoveryPromptWeight = 'calm' | 'urgent' | 'amber-lite';
type RecoveryPromptPhase = 'visible' | 'success' | 'exiting' | 'hidden';

export interface RecoveryBannerProps {
    recoverySupported: boolean;
    recoveryMethodCount: number | null;
    activationPending?: boolean;
    totalCredentialCount: number;
    escrowEnrolled?: boolean;
    pinEnabled?: boolean | null;
    onSetupPin?: () => void;
    onSetup: (options: {
        initialMethod: RecoverySetupType;
        onCompleted: (method: RecoverySetupType) => void;
        onClosed: () => void;
    }) => void;
}

type NavigatorWithUAData = Navigator & { userAgentData?: { platform?: string } };

const getPasskeyActionLabel = (): string => {
    const nav = navigator as NavigatorWithUAData;
    const hints = [nav.userAgent, nav.platform, nav.userAgentData?.platform]
        .filter((value): value is string => typeof value === 'string')
        .join(' ');

    if (/Android/i.test(hints)) return m['recovery.prompt.action.passkeyAndroid']();
    if (/Mac|iPhone|iPad|iPod|iOS/i.test(hints)) return m['recovery.prompt.action.passkeyApple']();
    if (/Win/i.test(hints)) return m['recovery.prompt.action.passkeyWindows']();

    return m['recovery.prompt.action.passkeyGeneric']();
};

export const RecoveryBanner: React.FC<RecoveryBannerProps> = ({
    recoverySupported,
    recoveryMethodCount,
    activationPending = false,
    totalCredentialCount,
    escrowEnrolled = false,
    pinEnabled = null,
    onSetupPin,
    onSetup,
}) => {
    const { track } = useAnalytics();
    const isPublic = isPublicComputerMode() || activationPending;
    const snoozedUntil = firstStartupStore.useTracked.recoveryPromptSnoozedUntil();
    const backupSnoozeCount = firstStartupStore.useTracked.recoveryBackupPromptSnoozeCount();
    const [phase, setPhase] = useState<RecoveryPromptPhase>('visible');
    const [completed, setCompleted] = useState(false);
    const [setupRequested, setSetupRequested] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const shownRef = useRef(false);
    const setupRequestedRef = useRef(false);
    const completionHandledRef = useRef(false);

    const recommendedMethod = useMemo<RecoverySetupType>(
        () => (!Capacitor.isNativePlatform() && isWebAuthnSupported() ? 'passkey' : 'phrase'),
        []
    );
    const isSnoozed = !isPublic && snoozedUntil > currentTime;

    let activeTier: 'urgent' | 'standard' | 'pin-first' | 'backup' | 'none' = 'none';

    if (recoveryMethodCount === 0 && recoverySupported) {
        if (isPublic) {
            activeTier = 'urgent';
        } else if (escrowEnrolled) {
            if (pinEnabled === false && !isSnoozed) {
                activeTier = 'pin-first';
            } else if (pinEnabled === true && !isSnoozed && backupSnoozeCount < 2) {
                activeTier = 'backup';
            }
        } else if (totalCredentialCount > 0 && !isSnoozed) {
            activeTier = 'standard';
        }
    }

    const isRendered =
        (!completed && activeTier !== 'none') || phase === 'success' || phase === 'exiting';

    useEffect(() => {
        if (activeTier === 'none' || shownRef.current) return;

        shownRef.current = true;

        let weight: RecoveryPromptWeight = 'calm';
        let method: 'pin' | RecoverySetupType | undefined = undefined;
        let tier: 'pin-first' | 'backup' | undefined = undefined;

        if (activeTier === 'urgent') {
            weight = 'urgent';
        } else if (activeTier === 'pin-first') {
            weight = 'amber-lite';
            method = 'pin';
            tier = 'pin-first';
        } else if (activeTier === 'backup') {
            weight = 'calm';
            method = recommendedMethod;
            tier = 'backup';
        }

        track(AnalyticsEvents.DASHBOARD_RECOVERY_PROMPT_INTERACTED, {
            action: 'shown',
            weight,
            method,
            tier,
        });
    }, [activeTier, track, recommendedMethod]);

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

        if (activeTier === 'pin-first') {
            track(AnalyticsEvents.DASHBOARD_RECOVERY_PROMPT_INTERACTED, {
                action: 'clicked',
                weight: 'amber-lite',
                method: 'pin',
                tier: 'pin-first',
            });
            onSetupPin?.();
            return;
        }

        setupRequestedRef.current = true;
        completionHandledRef.current = false;
        setSetupRequested(true);

        const weight = activeTier === 'urgent' ? 'urgent' : 'calm';
        const tier = activeTier === 'backup' ? 'backup' : undefined;

        track(AnalyticsEvents.DASHBOARD_RECOVERY_PROMPT_INTERACTED, {
            action: 'clicked',
            weight,
            method: recommendedMethod,
            tier,
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
                        tier,
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

    const handleSnooze = (e: React.MouseEvent): void => {
        e.stopPropagation();
        const nextSnoozedUntil = Date.now() + RECOVERY_PROMPT_SNOOZE_MS;
        setCurrentTime(Date.now());
        firstStartupStore.set.recoveryPromptSnoozedUntil(nextSnoozedUntil);

        if (activeTier === 'backup') {
            firstStartupStore.set.recoveryBackupPromptSnoozeCount(backupSnoozeCount + 1);
        }

        shownRef.current = false;

        let weight: RecoveryPromptWeight = 'calm';
        let method: 'pin' | RecoverySetupType | undefined = undefined;
        let tier: 'pin-first' | 'backup' | undefined = undefined;

        if (activeTier === 'pin-first') {
            weight = 'amber-lite';
            method = 'pin';
            tier = 'pin-first';
        } else if (activeTier === 'backup') {
            weight = 'calm';
            method = recommendedMethod;
            tier = 'backup';
        }

        track(AnalyticsEvents.DASHBOARD_RECOVERY_PROMPT_INTERACTED, {
            action: 'snoozed',
            weight,
            method,
            tier,
        });
        setPhase('exiting');
    };

    const handleSetupSecondary = (): void => {
        if (setupRequestedRef.current) return;

        setupRequestedRef.current = true;
        completionHandledRef.current = false;
        setSetupRequested(true);

        track(AnalyticsEvents.DASHBOARD_RECOVERY_PROMPT_INTERACTED, {
            action: 'clicked',
            weight: 'amber-lite',
            method: recommendedMethod,
            tier: 'pin-first',
        });

        try {
            onSetup({
                initialMethod: recommendedMethod,
                onCompleted: method => {
                    if (completionHandledRef.current) return;

                    completionHandledRef.current = true;
                    track(AnalyticsEvents.DASHBOARD_RECOVERY_PROMPT_INTERACTED, {
                        action: 'completed',
                        weight: 'amber-lite',
                        method,
                        tier: 'pin-first',
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

    const isSuccess = completed;
    const isExiting = phase === 'exiting';

    const getStyles = () => {
        switch (activeTier) {
            case 'urgent':
                return {
                    container: 'bg-amber-50 border-amber-200',
                    iconContainer: 'bg-amber-100 group-hover:bg-amber-200',
                    icon: shieldOutline,
                    iconColor: 'text-amber-600',
                    titleColor: 'text-amber-900',
                    bodyColor: 'text-amber-800',
                    actionColor: 'text-amber-900',
                };
            case 'standard':
                return {
                    container: 'bg-white border-grayscale-200',
                    iconContainer: 'bg-amber-50 group-hover:bg-amber-100',
                    icon: shieldOutline,
                    iconColor: 'text-amber-600',
                    titleColor: 'text-grayscale-900',
                    bodyColor: 'text-grayscale-600',
                    actionColor: 'text-grayscale-800',
                };
            case 'pin-first':
                return {
                    container: 'bg-white border-grayscale-200',
                    iconContainer: 'bg-amber-50 group-hover:bg-amber-100',
                    icon: keypadOutline,
                    iconColor: 'text-amber-600',
                    titleColor: 'text-grayscale-900',
                    bodyColor: 'text-grayscale-600',
                    actionColor: 'text-grayscale-800',
                };
            case 'backup':
                return {
                    container: 'bg-white border-grayscale-200',
                    iconContainer: 'bg-emerald-50 group-hover:bg-emerald-100',
                    icon: shieldCheckmarkOutline,
                    iconColor: 'text-emerald-600',
                    titleColor: 'text-grayscale-900',
                    bodyColor: 'text-grayscale-600',
                    actionColor: 'text-grayscale-800',
                };
            default:
                return {
                    container: '',
                    iconContainer: '',
                    icon: shieldOutline,
                    iconColor: '',
                    titleColor: '',
                    bodyColor: '',
                    actionColor: '',
                };
        }
    };

    const styles = getStyles();

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
                        className={`animate-fade-in-up w-full flex items-stretch rounded-[20px] border transition-colors ${styles.container}`}
                    >
                        <div className="flex-1 min-w-0 flex flex-col">
                            <button
                                type="button"
                                onClick={handleSetup}
                                disabled={setupRequested}
                                aria-label={m['recovery.prompt.openAria']()}
                                className={`group flex-1 min-w-0 flex items-center gap-3 p-4 text-start rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-wait ${
                                    activeTier === 'pin-first' ? 'pb-1' : ''
                                }`}
                            >
                                <span
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${styles.iconContainer}`}
                                >
                                    <IonIcon
                                        icon={styles.icon}
                                        className={`text-lg ${styles.iconColor}`}
                                    />
                                </span>

                                <span className="flex-1 min-w-0">
                                    <span
                                        className={`block text-sm font-semibold leading-tight ${styles.titleColor}`}
                                    >
                                        {activeTier === 'pin-first'
                                            ? m['recovery.prompt.pinFirst.title']()
                                            : activeTier === 'backup'
                                              ? m['recovery.prompt.backup.title']()
                                              : activationPending
                                                ? m['recovery.prompt.activation.title']()
                                                : isPublic
                                                  ? m['recovery.prompt.urgent.title']()
                                                  : m['recovery.prompt.calm.title']()}
                                    </span>
                                    <span
                                        className={`block text-xs leading-snug mt-0.5 ${styles.bodyColor}`}
                                    >
                                        {activeTier === 'pin-first'
                                            ? m['recovery.prompt.pinFirst.body']()
                                            : activeTier === 'backup'
                                              ? m['recovery.prompt.backup.body']()
                                              : activationPending
                                                ? m['recovery.prompt.activation.body']()
                                                : isPublic
                                                  ? m['recovery.prompt.urgent.body']()
                                                  : m['recovery.prompt.calm.body']()}
                                    </span>
                                    <span
                                        className={`block text-xs font-semibold mt-1 ${styles.actionColor}`}
                                    >
                                        {activeTier === 'pin-first'
                                            ? m['recovery.prompt.pinFirst.action']()
                                            : recommendedMethod === 'passkey'
                                              ? getPasskeyActionLabel()
                                              : m['recovery.prompt.action.phrase']()}
                                    </span>
                                </span>
                            </button>

                            {activeTier === 'pin-first' && (
                                <button
                                    type="button"
                                    onClick={handleSetupSecondary}
                                    disabled={setupRequested}
                                    className="self-start ms-[4rem] mb-3 text-xs font-medium text-grayscale-600 hover:text-grayscale-900 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                                >
                                    {m['recovery.prompt.pinFirst.secondary']()}
                                </button>
                            )}
                        </div>

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
