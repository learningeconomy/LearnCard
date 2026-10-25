import {
    isSharePrivateSession,
    scrubShareTelemetry,
    useSharePrivateSession,
} from '../components/share-links/sharePrivacy';
import * as Sentry from '@sentry/react';
import { makeFetchTransport } from '@sentry/browser';
import { useEffect, useRef } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useGetPreferencesForDid, useWallet } from 'learn-card-base';
import { configureSentryTransport, configureLoggerContext } from 'learn-card-base';
import { getResolvedTenantConfig } from '../config/tenantConfigState';
import { getLogger } from 'learn-card-base';
import { useFeedbackReportingEligibility } from '../feedback/reporting/eligibility';
import {
    canSendCrashReport,
    initializeNativeCrashReporting,
    setCrashReportingEnabled,
    updateCrashReportingRoute,
} from './nativeCrashReporting';
import { routingHistory } from './routingHistory';
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

let initialized = false;
export const initSentryFromTenant = async (): Promise<void> => {
    if (initialized) return;
    initialized = true;
    await initializeNativeCrashReporting();
    updateCrashReportingRoute(routingHistory.location.pathname);
    routingHistory.listen(location => updateCrashReportingRoute(location.pathname));
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
        // Native Sentry is initialized separately with native privacy callbacks.
        // Do not call @sentry/capacitor.init(): its automatic native bootstrap
        // would replace those callbacks and bypass the persisted preference.
        release: `learncard-web@${__PACKAGE_VERSION__}+${__BUILD_SHA__}`,
        sendDefaultPii: false,
        // Replay uploads bypass beforeSend. Gate every envelope as well, including
        // the final buffered replay that replay.stop() normally flushes.
        transport: options => {
            const transport = makeFetchTransport(options);
            return {
                send: envelope =>
                    canSendCrashReport()
                        ? transport.send(envelope)
                        : Promise.resolve({ statusCode: 200 }),
                flush: timeout => transport.flush(timeout),
            };
        },
        initialScope: {
            tags: { tenant_id: config.tenantId, error_layer: 'javascript', web_sha: __BUILD_SHA__ },
        },
        beforeSend: event => (canSendCrashReport() ? scrubShareTelemetry(event) : null),
        beforeSendTransaction: event => (canSendCrashReport() ? scrubShareTelemetry(event) : null),
        beforeBreadcrumb: breadcrumb =>
            canSendCrashReport() ? scrubShareTelemetry(breadcrumb) : null,
        environment: env,
        tracePropagationTargets: traceDomains,
        integrations: [
            Sentry.feedbackIntegration({
                colorScheme: 'system',
                showBranding: false,
                autoInject: false,
            }),
            Sentry.reactRouterV5BrowserTracingIntegration({ history: routingHistory }),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
            // captureConsoleIntegration removed: logger is now the only path to Sentry,
            // ensuring PII scrubbing and bugReportsEnabled gate are always applied.
        ],
        // Performance Monitoring
        tracesSampleRate: 0.5,
        replaysSessionSampleRate: canSendCrashReport() ? 0.1 : 0,
        replaysOnErrorSampleRate: canSendCrashReport() ? 1.0 : 0,
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
    const {
        data: preferences,
        isLoading: preferencesLoading,
        isSuccess: preferencesResolved,
    } = useGetPreferencesForDid();
    const reportingEligibility = useFeedbackReportingEligibility();
    const privateSession = useSharePrivateSession();
    const previousUser = useRef(currentUser);
    // Remote crash reporting follows the raw preference. The native gate retains
    // the last resolved choice across launches (unknown first install fails closed).
    // Cached preferences
    // are trusted only for a fully resolved authenticated profile; only the
    // user-attachable diagnostic buffer uses the stricter adult eligibility.
    const canTrustPreferences = Boolean(
        currentUser &&
        reportingEligibility.profileId &&
        !preferencesLoading &&
        (preferencesResolved || preferences !== undefined)
    );
    const bugReportsEnabled =
        !privateSession && (canTrustPreferences ? (preferences?.bugReportsEnabled ?? true) : true);

    useEffect(() => {
        let active = true;
        // A real logout resets account-specific preferences. Initial unresolved
        // auth must preserve the native persisted gate before cached crash upload.
        if (canTrustPreferences || (previousUser.current && !currentUser)) {
            setCrashReportingEnabled(
                canTrustPreferences ? (preferences?.bugReportsEnabled ?? true) : true
            );
        }
        if (!bugReportsEnabled) void Sentry.getReplay()?.stop();
        previousUser.current = currentUser;
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
                        if (
                            !active ||
                            !bugReportsEnabled ||
                            isSharePrivateSession() ||
                            typeof did !== 'string' ||
                            did.trim() === ''
                        ) {
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
            active = false;
        };
    }, [
        currentUser,
        bugReportsEnabled,
        canTrustPreferences,
        preferences?.bugReportsEnabled,
        reportingEligibility.bug,
        reportingEligibility.profileId,
    ]);
};
