import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useWallet } from 'learn-card-base';
import { useGetPreferencesForDid } from 'learn-card-base';
import { getResolvedTenantConfig } from '../config/bootstrapTenantConfig';

export type UseSentryIdentifyOptions = {
    debug?: boolean;
};

/**
 * Initialize Sentry from the resolved TenantConfig.
 *
 * Call this after bootstrapTenantConfig() has resolved.
 * Falls back to Vite-injected globals if TenantConfig is not yet available.
 */
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
                ...config.observability.sentryTraceDomains.map(d => new RegExp(`^https://${d.replace(/\./g, '\\.')}`)),
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
    const { data: preferences } = useGetPreferencesForDid();
    // Default true so existing users without stored preferences are unaffected
    const bugReportsEnabled = preferences?.bugReportsEnabled ?? true;

    useEffect(() => {
        if (Sentry.getClient()) {
            if (currentUser && bugReportsEnabled) {
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
    }, [currentUser, bugReportsEnabled]);
};
