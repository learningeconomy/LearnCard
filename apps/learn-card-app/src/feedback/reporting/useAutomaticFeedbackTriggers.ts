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
 * - backgrounding or cleanup stops native shake sensing and every registered
 *   listener handle is removed, including registrations that resolve late;
 * - screenshot observation has its own lifecycle and is not churned by shake
 *   flag changes.
 *
 * Foreground starts fail-closed: shakes arriving before the initial app state
 * resolves are ignored.
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
        let sensingQueue = Promise.resolve();

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

        const setSensing = (shouldStart: boolean): void => {
            sensingQueue = sensingQueue
                .catch(() => undefined)
                .then(async () => {
                    if (shouldStart && disposed) return;

                    if (shouldStart) {
                        await ShakeObserver.start(SHAKE_OBSERVER_OPTIONS);
                    } else {
                        await ShakeObserver.stop();
                    }
                })
                .catch(error => {
                    log.warn('feedback.automatic.shake-sensing-failed', error);
                });
        };

        const handleShake = (): void => {
            if (!isForeground) return;

            const timestamp = Date.now();
            if (isShakeInCooldown(timestamp, lastShakeAt)) return;
            lastShakeAt = timestamp;

            forward('shake');
        };

        track(
            App.addListener('appStateChange', state => {
                receivedAppStateChange = true;
                isForeground = state.isActive;
                setSensing(state.isActive);
            })
        );
        track(ShakeObserver.addListener('shake', handleShake));

        App.getState()
            .then(({ isActive }) => {
                if (disposed || receivedAppStateChange) return;

                isForeground = isActive;
                if (isActive) setSensing(true);
            })
            .catch(error => {
                // Fail closed: without a confirmed state, sensing stays off.
                log.warn('feedback.automatic.app-state-failed', error);
            });

        return () => {
            disposed = true;
            isForeground = false;
            setSensing(false);
            handles.forEach(handle => {
                void handle.remove();
            });
        };
    }, [enabled, shakeFlagEnabled]);
};
