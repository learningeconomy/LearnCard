import { useEffect, useRef } from 'react';

import { App } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { getLogger } from 'learn-card-base';

import { ScreenshotObserver } from './native/ScreenshotObserver';
import { SHAKE_OBSERVER_OPTIONS, ShakeObserver } from './native/ShakeObserver';
import { isShakeInCooldown } from './triggerPolicy';
import type { ReportProblemOptions } from './types';

const log = getLogger('feedback');

/** Hook input (LC-2086 Task 10). */
export interface AutomaticFeedbackTriggersInput {
    /** Bug-reporting eligibility (`eligibility.bug`); nothing registers when false. */
    enabled: boolean;
    /** Feedback controller entry point; called with `shake` / `screenshot` sources. */
    reportProblem: (options: ReportProblemOptions) => Promise<void>;
}

interface ShakeSensingArbiter {
    request: (owner: symbol, shouldStart: boolean) => void;
    release: (owner: symbol) => void;
}

const SHAKE_SENSING_MAX_ATTEMPTS = 3;
const SHAKE_SENSING_RETRY_DELAY_MS = 100;

/** Serialize native sensing calls and converge to the latest requested state. */
const createShakeSensingArbiter = (): ShakeSensingArbiter => {
    const ownerStates = new Map<symbol, boolean>();
    let desiredState = false;
    let appliedState = false;
    let isApplying = false;
    let failedState: boolean | undefined;
    let failedAttempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const resetFailures = (): void => {
        failedState = undefined;
        failedAttempts = 0;
    };

    const clearRetry = (): void => {
        if (retryTimer === undefined) return;

        clearTimeout(retryTimer);
        retryTimer = undefined;
    };

    const applyDesiredState = (): void => {
        if (isApplying || retryTimer !== undefined || desiredState === appliedState) return;

        const stateBeingApplied = desiredState;
        isApplying = true;

        void (async () => {
            let succeeded = false;
            try {
                if (stateBeingApplied) {
                    await ShakeObserver.start(SHAKE_OBSERVER_OPTIONS);
                } else {
                    await ShakeObserver.stop();
                }

                appliedState = stateBeingApplied;
                resetFailures();
                succeeded = true;
            } catch (error) {
                log.warn('feedback.automatic.shake-sensing-failed', error);

                if (failedState === stateBeingApplied) {
                    failedAttempts += 1;
                } else {
                    failedState = stateBeingApplied;
                    failedAttempts = 1;
                }
            } finally {
                isApplying = false;
            }

            if (stateBeingApplied !== desiredState) {
                resetFailures();
                applyDesiredState();
                return;
            }

            if (succeeded) {
                applyDesiredState();
                return;
            }

            if (failedAttempts < SHAKE_SENSING_MAX_ATTEMPTS) {
                retryTimer = setTimeout(() => {
                    retryTimer = undefined;
                    applyDesiredState();
                }, SHAKE_SENSING_RETRY_DELAY_MS);
            }
        })();
    };

    const applyOwnerStates = (): void => {
        const nextDesiredState = [...ownerStates.values()].some(Boolean);
        const stateChanged = desiredState !== nextDesiredState;
        desiredState = nextDesiredState;

        if (stateChanged) resetFailures();
        clearRetry();
        applyDesiredState();
    };

    return {
        request: (owner, shouldStart) => {
            ownerStates.set(owner, shouldStart);
            applyOwnerStates();
        },
        release: owner => {
            if (!ownerStates.delete(owner)) return;

            applyOwnerStates();
        },
    };
};

// The native plugin is process-global, so arbitration must outlive individual
// React mounts and aggregate their desired states. One mount's cleanup cannot
// stop sensing while another live owner still requires it.
const shakeSensingArbiter = createShakeSensingArbiter();

/**
 * Mount the automatic feedback triggers: the local start/stop shake observer
 * (iOS and Android, gated by the LaunchDarkly `shakeToReportEnabled` flag —
 * missing means false) and the local iOS screenshot observer.
 *
 * Registration rules:
 *
 * - no listeners on web or when bug eligibility is false;
 * - the shake listener additionally requires `shakeToReportEnabled === true`;
 * - the screenshot listener is iOS-only and independent of the flag;
 * - the foreground check runs inside the shake callback against the app-state
 *   ref maintained from the initial `App.getState()` plus
 *   `App.addListener('appStateChange')`, so background shakes are ignored;
 * - the ten-second shake cooldown (Task 2's `isShakeInCooldown`) is enforced
 *   before forwarding, complementing the coordinator's own cooldown so a
 *   mocked controller still observes the timing policy;
 * - backgrounding or cleanup releases this hook's sensing request; native
 *   sensing stops when no remaining owner requires it, and every registered
 *   listener handle is removed, including registrations that resolve late;
 * - screenshot observation has its own lifecycle and is not churned by shake
 *   flag changes.
 *
 * Foreground starts fail-closed: shakes arriving before both the lifecycle
 * listener registration and an app-state confirmation are ignored.
 */
export const useAutomaticFeedbackTriggers = ({
    enabled,
    reportProblem,
}: AutomaticFeedbackTriggersInput): void => {
    const flags = useFlags();
    const shakeFlagEnabled = flags.shakeToReportEnabled === true;

    // Keep the latest controller in a ref so listener registration never
    // churns on controller identity changes.
    const reportProblemRef = useRef(reportProblem);
    reportProblemRef.current = reportProblem;

    const shakeSensingOwnerRef = useRef<symbol | null>(null);
    if (shakeSensingOwnerRef.current === null) {
        shakeSensingOwnerRef.current = Symbol('automatic-feedback-shake-sensing-owner');
    }
    const shakeSensingOwner = shakeSensingOwnerRef.current;

    useEffect(() => {
        if (!enabled) return;
        if (!Capacitor.isNativePlatform()) return;
        if (Capacitor.getPlatform() !== 'ios') return;

        let disposed = false;
        let handle: PluginListenerHandle | undefined;

        ScreenshotObserver.addListener('screenshotTaken', () => {
            reportProblemRef.current({ source: 'screenshot' }).catch(error => {
                log.warn('feedback.automatic.forward-failed', error);
            });
        })
            .then(registeredHandle => {
                if (disposed) {
                    void registeredHandle.remove();
                } else {
                    handle = registeredHandle;
                }
            })
            .catch(() => undefined);

        return () => {
            disposed = true;
            if (handle) void handle.remove();
        };
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;
        if (!Capacitor.isNativePlatform()) return;

        const platform = Capacitor.getPlatform();
        const shouldRegisterShake =
            shakeFlagEnabled && (platform === 'ios' || platform === 'android');
        if (!shouldRegisterShake) return;

        let disposed = false;
        const handles: PluginListenerHandle[] = [];
        let receivedAppStateChange = false;
        let lifecycleListenerReady = false;
        let lifecycleListenerFailed = false;
        let latestAppState: boolean | undefined;

        const track = (registration: Promise<PluginListenerHandle>): void => {
            registration
                .then(handle => {
                    if (disposed) {
                        void handle.remove();
                    } else {
                        handles.push(handle);
                    }
                })
                .catch(() => undefined);
        };

        const forward = (source: ReportProblemOptions['source']): void => {
            reportProblemRef.current({ source }).catch(error => {
                log.warn('feedback.automatic.forward-failed', error);
            });
        };

        let isForeground = false;
        let lastShakeAt: number | undefined;

        const applyAppState = (): void => {
            if (
                disposed ||
                lifecycleListenerFailed ||
                !lifecycleListenerReady ||
                latestAppState === undefined
            ) {
                return;
            }

            isForeground = latestAppState;
            shakeSensingArbiter.request(shakeSensingOwner, isForeground);
        };

        const handleShake = (): void => {
            if (!isForeground) return;

            const timestamp = Date.now();
            if (isShakeInCooldown(timestamp, lastShakeAt)) return;
            lastShakeAt = timestamp;

            forward('shake');
        };

        App.addListener('appStateChange', state => {
            if (disposed || lifecycleListenerFailed) return;

            receivedAppStateChange = true;
            latestAppState = state.isActive;
            applyAppState();
        })
            .then(handle => {
                if (disposed) {
                    void handle.remove();
                    return;
                }

                handles.push(handle);
                lifecycleListenerReady = true;
                applyAppState();
            })
            .catch(error => {
                if (disposed) return;

                lifecycleListenerFailed = true;
                lifecycleListenerReady = false;
                isForeground = false;
                shakeSensingArbiter.release(shakeSensingOwner);
                log.warn('feedback.automatic.app-state-listener-failed', error);
            });
        track(ShakeObserver.addListener('shake', handleShake));

        App.getState()
            .then(({ isActive }) => {
                if (disposed || lifecycleListenerFailed || receivedAppStateChange) return;

                latestAppState = isActive;
                applyAppState();
            })
            .catch(error => {
                // Fail closed: without a confirmed state, sensing stays off.
                log.warn('feedback.automatic.app-state-failed', error);
            });

        return () => {
            disposed = true;
            isForeground = false;
            shakeSensingArbiter.release(shakeSensingOwner);
            handles.forEach(handle => {
                void handle.remove();
            });
        };
    }, [enabled, shakeFlagEnabled]);
};
