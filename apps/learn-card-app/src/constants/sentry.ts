import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useWallet } from 'learn-card-base';
import { useGetPreferencesForDid } from 'learn-card-base';
import { configureSentryTransport, configureLoggerContext } from 'learn-card-base';
import { getResolvedTenantConfig } from '../config/bootstrapTenantConfig';
import { getLogger } from 'learn-card-base';
const log = getLogger('sentry');

export type UseSentryIdentifyOptions = {
    debug?: boolean;
};

/**
 * Initialize Sentry from the resolved TenantConfig.
 *
 * Call this after bootstrapTenantConfig() has resolved.
 * Falls back to Vite-injected globals if TenantConfig is not yet available.
 */
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const initSentryFromTenant = (): void => {
    let dsn: string | undefined;
    let env: string | undefined;
    let traceDomains: (string | RegExp)[] = ['localhost'];

    try {
        const config = getResolvedTenantConfig();
        dsn = config.observability.sentryDsn;
        env = config.observability.sentryEnv;

        if (config.observability.sentryTraceDomains) {
            traceDomains = [
                'localhost',
                ...config.observability.sentryTraceDomains.map(
                    d => new RegExp(`^https://${escapeRegExp(d)}`)
                ),
            ];
        }
    } catch {
        dsn = typeof SENTRY_DSN !== 'undefined' ? SENTRY_DSN : undefined;
        env = typeof SENTRY_ENV !== 'undefined' ? SENTRY_ENV : undefined;
        traceDomains = [
            'localhost',
            /^https:\/\/network\.learncard\.com\/trpc/,
            /^https:\/\/api\.learncard\.app\/trpc/,
            /^https:\/\/cloud\.learncard\.com\/trpc/,
        ];
    }

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
        captureException: (err, tags, extra) =>
            Sentry.withScope(scope => {
                if (tags) Object.entries(tags).forEach(([k, v]) => scope.setTag(k, v));
                if (extra) Object.entries(extra).forEach(([k, v]) => scope.setExtra(k, v));
                Sentry.captureException(err);
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
    const { data: preferences } = useGetPreferencesForDid();
    // Default true so existing users without stored preferences are unaffected
    const bugReportsEnabled = preferences?.bugReportsEnabled ?? true;

    useEffect(() => {
        // Keep logger privacy gate in sync with user preferences
        configureLoggerContext({ bugReportsEnabled });

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
    }, [currentUser, bugReportsEnabled]);
};
