import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useGetPreferencesForDid, useWallet } from 'learn-card-base';
import { configureSentryTransport, configureLoggerContext } from 'learn-card-base';
import { getResolvedTenantConfig } from '../config/tenantConfigState';
import { getLogger } from 'learn-card-base';
import { useFeedbackReportingEligibility } from '../feedback/reporting/eligibility';
const log = getLogger('sentry');

export type UseSentryIdentifyOptions = {
    debug?: boolean;
};

/**
 * Initialize Sentry from the already validated TenantConfig.
 *
 * Call this after bootstrapTenantConfig() has resolved.
 */
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

    if (!env || env === 'development' || !dsn) return;

    Sentry.init({
        dsn,
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
            }),
            // captureConsoleIntegration removed: logger is now the only path to Sentry,
            // ensuring PII scrubbing and bugReportsEnabled gate are always applied.
        ],
        // Performance Monitoring
        tracesSampleRate: 0.5,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
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
    const currentUser = useCurrentUser();
    const { getDID } = useWallet();
    const { data: preferences, isLoading: preferencesLoading } = useGetPreferencesForDid();
    const reportingEligibility = useFeedbackReportingEligibility();
    // Remote crash reporting preserves the existing preference semantics so
    // login/onboarding/logout failures remain observable. Cached preferences
    // are trusted only for a fully resolved authenticated profile; only the
    // user-attachable diagnostic buffer uses the stricter adult eligibility.
    const canTrustPreferences = Boolean(
        currentUser && reportingEligibility.profileId && !preferencesLoading
    );
    const bugReportsEnabled = canTrustPreferences ? (preferences?.bugReportsEnabled ?? true) : true;

    useEffect(() => {
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
                        if (typeof did !== 'string' || did.trim() === '') {
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
    }, [currentUser, bugReportsEnabled, reportingEligibility.bug, reportingEligibility.profileId]);
};
