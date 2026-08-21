import { useEffect, useRef } from 'react';

import { App } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { CapacitorShake } from '@capgo/capacitor-shake';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { getLogger } from 'learn-card-base';

import { ScreenshotObserver } from './native/ScreenshotObserver';
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
 * Mount the automatic feedback triggers: the Capgo shake listener (iOS and
 * Android, gated by the LaunchDarkly `shakeToReportEnabled` flag — missing
 * means false) and the local iOS screenshot observer.
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
 * - every registered listener handle is removed on cleanup, including
 *   registrations that resolve after cleanup started.
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

        const platform = Capacitor.getPlatform();
        const shouldRegisterShake =
            shakeFlagEnabled && (platform === 'ios' || platform === 'android');
        const shouldRegisterScreenshot = platform === 'ios';

        if (!shouldRegisterShake && !shouldRegisterScreenshot) return;

        let disposed = false;
        const handles: PluginListenerHandle[] = [];

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

        const handleShake = (): void => {
            if (!isForeground) return;

            const timestamp = Date.now();
            if (isShakeInCooldown(timestamp, lastShakeAt)) return;
            lastShakeAt = timestamp;

            forward('shake');
        };

        const register = async (): Promise<void> => {
            try {
                const { isActive } = await App.getState();
                isForeground = isActive;
            } catch (error) {
                // Fail closed: without a confirmed state, shakes stay ignored.
                log.warn('feedback.automatic.app-state-failed', error);
            }

            // The foreground ref is only consulted by shakes; register the
            // app-state listener exactly when shakes are registered.
            if (shouldRegisterShake) {
                track(
                    App.addListener('appStateChange', state => {
                        isForeground = state.isActive;
                    })
                );
                track(CapacitorShake.addListener('shake', handleShake));
            }

            if (shouldRegisterScreenshot) {
                track(
                    ScreenshotObserver.addListener('screenshotTaken', () => forward('screenshot'))
                );
            }
        };

        void register();

        return () => {
            disposed = true;
            handles.forEach(handle => {
                void handle.remove();
            });
        };
    }, [enabled, shakeFlagEnabled]);
};
