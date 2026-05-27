import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useWallet } from 'learn-card-base';
import { configureSentryTransport, configureLoggerContext } from 'learn-card-base';
import { getLogger } from 'learn-card-base/logging/logger';
const log = getLogger('sentry');

export type UseSentryIdentifyOptions = {
    debug?: boolean;
};

// Set TRUE for development testing of Sentry
const isSentryEnabled = SENTRY_ENV && SENTRY_ENV !== 'development';

export const initSentry = () => {
    if (!SENTRY_DSN || !SENTRY_ENV) return;

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: SENTRY_ENV,
        tracePropagationTargets: [
            'localhost',
            /^https:\/\/api\.scoutnetwork\.org\/trpc/,
            /^https:\/\/scoutnetwork\.org\/trpc/,
            /^https:\/\/cloud\.scoutnetwork\.org\/trpc/,
        ],
        integrations: [
            Sentry.feedbackIntegration({
                colorScheme: 'system',
                showBranding: false,
                autoInject: false,
            }),
            Sentry.reactRouterV5BrowserTracingIntegration({ history }),
            Sentry.replayIntegration({
                maskAllText: false,
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

    if (!isSentryEnabled) return;

    // Wire the injectable transport so learn-card-base logger forwards to Sentry
    configureSentryTransport({
        captureException: (err, tags, extra) =>
            Sentry.withScope(scope => {
                if (tags) Object.entries(tags).forEach(([k, v]) => scope.setTag(k, v));
                if (extra) Object.entries(extra).forEach(([k, v]) => scope.setExtra(k, v));
                Sentry.captureException(err);
            }),
        captureMessage: (msg, level, tags, extra) =>
            Sentry.withScope(scope => {
                if (tags) Object.entries(tags).forEach(([k, v]) => scope.setTag(k, v));
                if (extra) Object.entries(extra).forEach(([k, v]) => scope.setExtra(k, v));
                Sentry.captureMessage(msg, level);
            }),
        addBreadcrumb: opts => Sentry.addBreadcrumb(opts),
        withScope: fn =>
            Sentry.withScope(scope => fn({ setTag: scope.setTag.bind(scope), setExtra: scope.setExtra.bind(scope) })),
    });
};

/**
 * Hook to identify the current user in Sentry once authenticated.
 * Optionally pass `{ debug: true }` to log additional details.
 */
export const useSentryIdentify = (options: UseSentryIdentifyOptions = {}) => {
    const currentUser = useCurrentUser();
    const { getDID } = useWallet();

    useEffect(() => {
        // Scouts has no per-user bugReportsEnabled pref; default enabled in prod
        configureLoggerContext({ bugReportsEnabled: !!isSentryEnabled });

        if (isSentryEnabled) {
            if (currentUser) {
                if (options.debug) log.debug('Identify user! 🎸', currentUser);
                getDID()
                    .then(did => {
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
    }, [currentUser]);
};
