import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useWallet } from 'learn-card-base';

export type UseSentryIdentifyOptions = {
    debug?: boolean;
};

// Set TRUE for development testing of sentry
const isSentryEnabled = SENTRY_ENV && SENTRY_ENV !== 'development';

if (isSentryEnabled) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: SENTRY_ENV,
        tracePropagationTargets: [
            'localhost',
            /^https:\/\/network\.learncard\.com\/trpc/,
            /^https:\/\/api\.learncard\.app\/trpc/,
            /^https:\/\/cloud\.learncard\.com\/trpc/,
        ],
        integrations: [
            Sentry.feedbackIntegration({
                // Additional SDK configuration goes in here, for example:
                colorScheme: 'system',
                showBranding: false,
                autoInject: false,
            }),
            Sentry.reactRouterV5BrowserTracingIntegration({ history }),
            Sentry.replayIntegration({
                // Additional SDK configuration goes in here, for example:
                maskAllText: true,
                blockAllMedia: true,
            }),
            Sentry.captureConsoleIntegration({
                levels: ['error'],
            }),
        ],
        // Performance Monitoring
        tracesSampleRate: 0.5, // Capture 100% of the transactions, reduce in production!
        // Capture Replay for 10% of all sessions,
        // plus for 100% of sessions with an error
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
}

export const useSentryIdentify = (options: UseSentryIdentifyOptions = {}) => {
    const currentUser = useCurrentUser();
    const { getDID } = useWallet();
    useEffect(() => {
        if (isSentryEnabled) {
            if (currentUser) {
                if (options.debug) console.debug('Identify user! 🎸', currentUser);
                getDID()
                    .then(did => {
                        if (typeof did !== 'string' || did.trim() === '') {
                            return;
                        }

                        const user = {
                            id: did,
                            //username: currentUser?.name, // TODO: Hash name
                            //email: sha256(currentUser?.email),
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
