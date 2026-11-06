import { isSharePrivateSession, scrubShareTelemetry } from '../components/share-links/sharePrivacy';
import * as Sentry from '@sentry/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useGetPreferencesForDid, useWallet } from 'learn-card-base';
import { configureSentryTransport, configureLoggerContext } from 'learn-card-base';
import { getResolvedTenantConfig, isTenantAnalyticsEnabled } from '../config/tenantConfigState';
import { getLogger } from 'learn-card-base';
import { useFeedbackReportingEligibility } from '../feedback/reporting/eligibility';
const log = getLogger('sentry');
import { usePrivacyConsent } from 'learn-card-base/hooks/usePrivacyGate';
let optionalTelemetryEnabled = false;
const OPTIONAL_SENTRY_ENVELOPE_ITEMS: Record<string, true> = {
    replay_event: true,
    replay_recording: true,
    transaction: true,
    profile: true,
};

export type UseSentryIdentifyOptions = {
    debug?: boolean;
};

/**
 * Initialize Sentry from the already validated TenantConfig.
 *
 * Call this after bootstrapTenantConfig() has resolved.
 */
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const setSentryOptionalTelemetryEnabled = (enabled: boolean): void => {
    optionalTelemetryEnabled = enabled && isTenantAnalyticsEnabled();
};

export const initSentryFromTenant = (): void => {
    const config = getResolvedTenantConfig();
    const dsn = config.observability.sentryDsn;
    const env = config.observability.sentryEnv;
    const traceDomains: (string | RegExp)[] = [
        'localhost',
        ...(config.observability.sentryTraceDomains ?? []).map(
            domain => new RegExp(`^https://${escapeRegExp(domain)}`)
        ),
    ];

    if (!env || env === 'development' || !dsn || isSharePrivateSession()) return;

    Sentry.init({
        dsn,
        beforeSend: event => {
            if (isSharePrivateSession()) return null;
            // Preserve error-triggered replay only within an authorized session;
            // startup errors must not start a recorder.
            if (optionalTelemetryEnabled && event.exception) {
                void Sentry.getReplay()?.flush();
            }
            return scrubShareTelemetry(event);
        },
        beforeSendTransaction: event =>
            isSharePrivateSession() ? null : scrubShareTelemetry(event),
        beforeBreadcrumb: breadcrumb =>
            isSharePrivateSession() ? null : scrubShareTelemetry(breadcrumb),
        environment: env,
        tracePropagationTargets: traceDomains,
        integrations: [
            Sentry.feedbackIntegration({
                colorScheme: 'system',
                showBranding: false,
                autoInject: false,
            }),
            Sentry.reactRouterV5BrowserTracingIntegration({ history }),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
                beforeAddRecordingEvent: event =>
                    optionalTelemetryEnabled && !isSharePrivateSession() ? event : null,
            }),
            // captureConsoleIntegration removed: logger is now the only path to Sentry,
            // ensuring PII scrubbing and bugReportsEnabled gate are always applied.
        ],
        // Performance Monitoring
        // Optional performance and replay data are enabled only after the
        // authenticated profile's analytics consent has resolved.
        tracesSampler: () => (optionalTelemetryEnabled && !isSharePrivateSession() ? 0.5 : 0),
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        // Sentry Replay.stop() force-flushes a session recording. This
        // supported transport filter drops queued optional envelopes on revoke
        // while allowing error events and security reporting through.
        transport: options => {
            const transport = Sentry.makeFetchTransport(options);
            return {
                send: envelope => {
                    if (optionalTelemetryEnabled && !isSharePrivateSession()) {
                        return transport.send(envelope);
                    }
                    const [headers, items] = envelope;
                    const retainedItems = items.filter(
                        ([itemHeaders]) => !OPTIONAL_SENTRY_ENVELOPE_ITEMS[itemHeaders.type]
                    );
                    if (retainedItems.length === items.length) return transport.send(envelope);
                    if (retainedItems.length === 0) return Promise.resolve({ statusCode: 200 });
                    return transport.send([headers, retainedItems] as typeof envelope);
                },
                flush: timeout => transport.flush(timeout),
            };
        },
    });

    // Wire the injectable transport so learn-card-base logger forwards to Sentry.
    // Each method opens a fresh Sentry scope so tags/extra are scoped to the
    // single event and don't bleed into unrelated events on the global scope.
    configureSentryTransport({
        // Errors: attach logger tags (scope, tenantId) + meta as extras, then capture.
        // Returns Sentry's event ID so callers (e.g. GenericErrorBoundary) can
        // attach the report to the originating event (LC-2086).
        captureException: (err, tags, extra) =>
            Sentry.withScope(scope => {
                if (tags) Object.entries(tags).forEach(([key, value]) => scope.setTag(key, value));
                if (extra)
                    Object.entries(extra).forEach(([key, value]) => scope.setExtra(key, value));
                return Sentry.captureException(err);
            }),
        // Warnings / string errors: same tag/extra injection, level forwarded as-is.
        captureMessage: (msg, level, tags, extra) =>
            Sentry.withScope(scope => {
                if (tags) Object.entries(tags).forEach(([k, v]) => scope.setTag(k, v));
                if (extra) Object.entries(extra).forEach(([k, v]) => scope.setExtra(k, v));
                Sentry.captureMessage(msg, level);
            }),
        // Info: recorded as a breadcrumb (timeline context), not a captured event.
        addBreadcrumb: opts => Sentry.addBreadcrumb(opts),
        // Escape hatch for callers that need direct scope access (e.g. logger.withContext).
        withScope: fn =>
            Sentry.withScope(scope =>
                fn({ setTag: scope.setTag.bind(scope), setExtra: scope.setExtra.bind(scope) })
            ),
    });
};

export const useSentryIdentify = (options: UseSentryIdentifyOptions = {}) => {
    const { analyticsEnabled, identityKey } = usePrivacyConsent();
    const currentUser = useCurrentUser();
    const { getDID } = useWallet();
    const { data: preferences, isLoading: preferencesLoading } = useGetPreferencesForDid();
    const reportingEligibility = useFeedbackReportingEligibility();
    const optionalTelemetryAllowed =
        analyticsEnabled &&
        identityKey !== null &&
        isTenantAnalyticsEnabled() &&
        !isSharePrivateSession();
    const activeReplayIdentity = useRef<string | null>(null);
    const stoppingReplay = useRef<Promise<void>>(Promise.resolve());
    const [sampleReplaySession] = useState(() => Math.random() < 0.1);
    // Revoke during render so an already-queued transport/recording callback
    // cannot observe the old permission while layout-effect cleanup is pending.
    if (!optionalTelemetryAllowed || activeReplayIdentity.current !== identityKey) {
        setSentryOptionalTelemetryEnabled(false);
    }

    useLayoutEffect(() => {
        let cancelled = false;
        const replay = Sentry.getReplay();
        if (optionalTelemetryAllowed) {
            // A previous session's stop flush must finish while transport is
            // blocked before a newly authorized identity can start recording.
            void stoppingReplay.current.then(() => {
                if (cancelled || isSharePrivateSession()) return;
                activeReplayIdentity.current = identityKey;
                setSentryOptionalTelemetryEnabled(true);
                if (sampleReplaySession) replay?.start();
                else replay?.startBuffering();
            });
        }
        return () => {
            cancelled = true;
            activeReplayIdentity.current = null;
            setSentryOptionalTelemetryEnabled(false);
            stoppingReplay.current = Promise.all([
                stoppingReplay.current,
                replay?.stop().catch(() => {}) ?? Promise.resolve(),
            ]).then(() => undefined);
        };
    }, [optionalTelemetryAllowed, identityKey, sampleReplaySession]);
    // Remote crash reporting preserves the existing preference semantics so
    // login/onboarding/logout failures remain observable. Cached preferences
    // are trusted only for a fully resolved authenticated profile; only the
    // user-attachable diagnostic buffer uses the stricter adult eligibility.
    const canTrustPreferences = Boolean(
        currentUser && reportingEligibility.profileId && !preferencesLoading
    );
    const bugReportsEnabled =
        !isSharePrivateSession() &&
        (canTrustPreferences ? (preferences?.bugReportsEnabled ?? true) : true);

    useEffect(() => {
        let cancelled = false;
        // Keep logger privacy gate in sync with user preferences
        configureLoggerContext({
            bugReportsEnabled,
            diagnosticLogCollectionEnabled: reportingEligibility.bug,
            diagnosticIdentity: reportingEligibility.profileId ?? null,
        });

        if (Sentry.getClient()) {
            if (currentUser && bugReportsEnabled) {
                if (options.debug) log.debug('Identify user! 🎸', { uid: currentUser.uid });
                getDID()
                    .then(did => {
                        if (cancelled || typeof did !== 'string' || did.trim() === '') {
                            return;
                        }

                        const user = {
                            id: did,
                        };
                        if (options.debug) log.debug('🔍 Sentry User Context Identified', user);

                        Sentry.setUser(user);
                        Sentry.setTag('packageVersion', __PACKAGE_VERSION__);
                    })
                    .catch(e => {
                        if (options.debug) {
                            log.error(
                                '❌ Unable to identify Sentry User because DID could not be generated.',
                                e
                            );
                        }
                    });
            } else {
                Sentry.setUser(null);
                Sentry.setTag('packageVersion', __PACKAGE_VERSION__);
            }
        }
        return () => {
            cancelled = true;
            Sentry.setUser(null);
        };
    }, [currentUser, bugReportsEnabled, reportingEligibility.bug, reportingEligibility.profileId]);
};
