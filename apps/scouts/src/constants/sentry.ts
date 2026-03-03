import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useWallet } from 'learn-card-base';

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
            Sentry.captureConsoleIntegration({
                levels: ['error'],
            }),
        ],
        // Performance Monitoring
        tracesSampleRate: 0.5, // Capture 50% of transactions
        replaysSessionSampleRate: 0.1, // Replay 10% of all sessions
        replaysOnErrorSampleRate: 1.0, // Replay 100% of error sessions
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
        if (isSentryEnabled) {
            if (currentUser) {
                if (options.debug) console.debug('Identify user! 🎸', currentUser);
                getDID()
                    .then(did => {
                        const user = {
                            id: did,
                            // username: currentUser?.name, // TODO: Hash name
                            // email: sha256(currentUser?.email),
                        };
                        if (options.debug) console.debug('🔍 Sentry User Context Identified', user);

                        Sentry.setUser(user);
                        Sentry.setTag('packageVersion', __PACKAGE_VERSION__);
                    })
                    .catch(e => {
                        if (options.debug) {
                            console.error(
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
