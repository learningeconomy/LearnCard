import { useSyncExternalStore } from 'react';
import { configureLoggerContext } from 'learn-card-base/logging/logger';
import { FirebaseProvider } from '../../analytics/providers/firebase';
import userflow from 'userflow.js';
import * as Sentry from '@sentry/react';

export const isShareViewerPath = (pathname: string): boolean => /^\/s(?:\/|$)/.test(pathname);

const isShareRoute = () =>
    typeof window !== 'undefined' && isShareViewerPath(window.location.pathname);
let privateSession = isShareRoute();
let privacyConfigured = false;
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
    if (privacyConfigured) return;
    privacyConfigured = true;
    privateSession = true;
    configureLoggerContext({
        bugReportsEnabled: false,
        diagnosticLogCollectionEnabled: false,
        diagnosticIdentity: null,
    });
    // Callers suppress capture during render; notify other mounted consumers afterward.
    queueMicrotask(() => listeners.forEach(listener => listener()));
    // The loader queues most API methods and injects its CDN script even for
    // reset(). isIdentified() is a synchronous, non-loading public check.
    if (userflow.isIdentified()) {
        userflow.setPageTrackingDisabled(true);
        userflow.reset();
    }
    void FirebaseProvider.disableCollectionIfStarted().catch(() => {});
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
