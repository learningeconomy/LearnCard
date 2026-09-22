import { useSyncExternalStore } from 'react';
import { configureLoggerContext } from 'learn-card-base/logging/logger';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import userflow from 'userflow.js';
import * as Sentry from '@sentry/react';

export const isShareViewerPath = (pathname: string): boolean => /^\/s(?:\/|$)/.test(pathname);

const isShareRoute = () =>
    typeof window !== 'undefined' && isShareViewerPath(window.location.pathname);
let privateSession = isShareRoute();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
export const useSharePrivateSession = (): boolean =>
    useSyncExternalStore(subscribe, isSharePrivateSession, () => false);

/** Sticky for this document: do not resume a recorder with private content in its buffers. */
export const isSharePrivateSession = (): boolean => privateSession || isShareRoute();
export const enterSharePrivacy = (): void => {
    privateSession = true;
    configureLoggerContext({
        bugReportsEnabled: false,
        diagnosticLogCollectionEnabled: false,
        diagnosticIdentity: null,
    });
    listeners.forEach(listener => listener());
    userflow.setPageTrackingDisabled(true);
    userflow.reset();
    void FirebaseAnalytics.setEnabled({ enabled: false }).catch(() => {});
    void Sentry.getReplay()?.stop();
};

/** Also protects navigation breadcrumbs recorded before the viewer mounts. */
export const scrubShareTelemetry = <T>(value: T): T => {
    const scrub = (item: unknown): unknown => {
        if (typeof item === 'string')
            return item.replace(
                /(\/s\/[^\s?#"'<>]+)(?:\?[^\s#"'<>]*)?#[^\s"'<>]*/g,
                '$1#[redacted]'
            );
        if (Array.isArray(item)) return item.map(scrub);
        if (item && typeof item === 'object')
            return Object.fromEntries(
                Object.entries(item).map(([key, child]) => [key, scrub(child)])
            );
        return item;
    };
    return scrub(value) as T;
};

/**
 * Narrowly scoped suppression for the authenticated creator surface.
 *
 * Unlike the sticky viewer session, this must not disable telemetry for the
 * rest of the signed-in document: analytics are paused while the creator is
 * open and restored on teardown. Recorders (Sentry Replay) are deliberately
 * never restarted, because their buffers may hold creator-sensitive content.
 * The existing user privacy preference is respected: Firebase analytics are
 * only re-enabled when they were enabled before suppression.
 */
let creatorDepth = 0;
let priorFirebaseEnabled: boolean | undefined;
let firebaseProbe: Promise<void> | undefined;

const pauseCapture = () => {
    configureLoggerContext({
        bugReportsEnabled: false,
        diagnosticLogCollectionEnabled: false,
        diagnosticIdentity: null,
    });
    userflow.setPageTrackingDisabled(true);
    userflow.reset();
    void FirebaseAnalytics.setEnabled({ enabled: false }).catch(() => {});
    void Sentry.getReplay()?.stop();
};

export const enterCreatorPrivacy = (): (() => void) => {
    creatorDepth += 1;
    if (creatorDepth === 1) {
        priorFirebaseEnabled = undefined;
        firebaseProbe = FirebaseAnalytics.isEnabled().then(
            result => {
                priorFirebaseEnabled = result?.enabled;
            },
            () => {
                priorFirebaseEnabled = undefined;
            }
        );
        pauseCapture();
    }
    let released = false;
    return () => {
        if (released) return;
        released = true;
        creatorDepth = Math.max(0, creatorDepth - 1);
        if (creatorDepth > 0 || isSharePrivateSession()) return;
        // Wait for the pre-suppression probe so a user's disabled preference is
        // never overwritten by an "enable" from a stale default.
        void (firebaseProbe ?? Promise.resolve()).then(() => {
            if (creatorDepth > 0 || isSharePrivateSession()) return;
            userflow.setPageTrackingDisabled(false);
            if (priorFirebaseEnabled === true) {
                void FirebaseAnalytics.setEnabled({ enabled: true }).catch(() => {});
            }
        });
    };
};

