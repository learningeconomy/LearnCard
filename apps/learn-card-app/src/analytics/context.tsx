import { isSharePrivateSession } from '../components/share-links/sharePrivacy';
import React, {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useState,
    useMemo,
    useCallback,
    useRef,
} from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('context');

import type { AnalyticsProvider, AnalyticsProviderName } from './types';
import type { AnalyticsEventName, EventPayload, FeedbackIdeaPayload } from './events';
import { NoopProvider } from './providers/noop';
import { getSharedEventContext, shouldDropEvents } from './sharedContext';
import { getResolvedTenantConfig, isTenantAnalyticsEnabled } from '../config/tenantConfigState';
import { setAnalyticsProvider as setSendCredentialFlowProvider } from '../helpers/sendCredentialFlow.helpers';
import { usePrivacyConsent } from 'learn-card-base/hooks/usePrivacyGate';
import { UserflowConsentLifecycle } from '../constants/userflow';

/**
 * Lazily load and instantiate the analytics provider from the already validated TenantConfig.
 */
async function loadProvider(canCapture: () => boolean): Promise<AnalyticsProvider> {
    if (isSharePrivateSession()) return new NoopProvider();
    let config;

    try {
        config = getResolvedTenantConfig();
    } catch {
        return new NoopProvider();
    }
    if (!config.features.analytics) return new NoopProvider();
    const providerName: AnalyticsProviderName = config.observability.analyticsProvider ?? 'noop';
    const posthogKey = config.observability.posthogKey;
    const posthogHost = config.observability.posthogHost;

    switch (providerName) {
        case 'posthog': {
            if (!posthogKey) {
                log.warn(
                    '[Analytics] PostHog selected but no posthogKey configured, falling back to noop'
                );
                return new NoopProvider();
            }

            const { PostHogProvider } = await import('./providers/posthog');

            return new PostHogProvider(
                {
                    apiKey: posthogKey,
                    apiHost: posthogHost,
                },
                { canCapture }
            );
        }

        case 'firebase': {
            const { FirebaseProvider } = await import('./providers/firebase');
            return new FirebaseProvider();
        }

        case 'noop':
        default: {
            return new NoopProvider();
        }
    }
}

/**
 * Wrap a provider so every `track`/`page` call carries the enforced
 * shared context (`environment`, `app_version`, `tenant_id`,
 * `platform`) and automation/e2e traffic is dropped client-side.
 * Enforced context wins key conflicts — call sites cannot override
 * `environment`. PostHog additionally applies this at the SDK level
 * (see `applyPostHogHygiene`) so `$exception`/`$rageclick`/`$pageleave`
 * are covered too.
 */
function withSharedContext(
    provider: AnalyticsProvider,
    canCollect: () => boolean = () => true
): AnalyticsProvider {
    return {
        name: provider.name,
        init: () => (isSharePrivateSession() ? Promise.resolve() : provider.init()),
        identify: (userId, traits) => {
            // Drop automation/e2e and stale identity callbacks synchronously.
            if (!canCollect() || shouldDropEvents()) return Promise.resolve();
            return provider.identify(userId, traits);
        },
        reset: () => provider.reset(),
        setEnabled: enabled =>
            provider.setEnabled(enabled && canCollect() && !isSharePrivateSession()),
        track: async (event, properties) => {
            if (!canCollect() || shouldDropEvents()) return;
            await provider.track(event, { ...properties, ...getSharedEventContext() });
        },
        submitFeedbackIdea: async properties => {
            if (shouldDropEvents()) return;
            await provider.submitFeedbackIdea({
                source: properties.source,
                message: properties.message,
                currentRoute: properties.currentRoute,
                ...(typeof properties.appVersion === 'string'
                    ? { appVersion: properties.appVersion }
                    : {}),
            });
        },
        page: async (name, properties) => {
            if (!canCollect() || shouldDropEvents()) return;
            await provider.page(name, { ...properties, ...getSharedEventContext() });
        },
    };
}

interface AnalyticsContextValue {
    provider: AnalyticsProvider;
    isReady: boolean;
}

const ANALYTICS_CONTEXT_KEY = '__learncardAnalyticsContext__';

const getAnalyticsContext = (): React.Context<AnalyticsContextValue | null> => {
    const globalScope = globalThis as typeof globalThis & {
        [ANALYTICS_CONTEXT_KEY]?: React.Context<AnalyticsContextValue | null>;
    };

    if (!globalScope[ANALYTICS_CONTEXT_KEY]) {
        globalScope[ANALYTICS_CONTEXT_KEY] = createContext<AnalyticsContextValue | null>(null);
        globalScope[ANALYTICS_CONTEXT_KEY].displayName = 'AnalyticsContext';
    }

    return globalScope[ANALYTICS_CONTEXT_KEY];
};

const AnalyticsContext = getAnalyticsContext();

interface AnalyticsProviderProps {
    children: React.ReactNode;
}

/**
 * Analytics provider component that lazily loads the configured analytics backend.
 * Wrap your app with this provider to enable analytics throughout.
 */
export function AnalyticsContextProvider({ children }: AnalyticsProviderProps) {
    const consent = usePrivacyConsent();
    const [provider, setProvider] = useState<AnalyticsProvider>(() => new NoopProvider());
    const permitted =
        consent.analyticsEnabled && consent.identityKey !== null && isTenantAnalyticsEnabled();
    const [isReady, setIsReady] = useState(false);
    const providerRef = useRef<AnalyticsProvider | null>(null);
    const generationRef = useRef(0);
    const activeIdentityKeyRef = useRef<string | null>(null);
    activeIdentityKeyRef.current = permitted ? consent.identityKey : null;

    useLayoutEffect(() => {
        const generation = ++generationRef.current;
        if (!permitted) {
            const active = providerRef.current;
            providerRef.current = null;
            setProvider(new NoopProvider());
            setIsReady(true);
            if (active) {
                void active.setEnabled(false);
            }
            setSendCredentialFlowProvider(null);
            return;
        }
        let mounted = true;
        const activate = async () => {
            const identityKey = consent.identityKey;
            const canCapture = () => activeIdentityKeyRef.current === identityKey;
            const raw = await loadProvider(canCapture);
            if (generation !== generationRef.current || !mounted) return;
            await raw.init();
            if (generation !== generationRef.current || !mounted) {
                await raw.setEnabled(false);
                return;
            }
            await raw.setEnabled(true);
            if (generation !== generationRef.current || !mounted) {
                await raw.setEnabled(false);
                return;
            }
            const loadedProvider = withSharedContext(raw, canCapture);
            providerRef.current = loadedProvider;
            setProvider(loadedProvider);
            setIsReady(true);
            setSendCredentialFlowProvider(loadedProvider);
        };
        setIsReady(false);
        activate().catch(error => {
            log.error('[Analytics] Failed to load provider', error);
            if (generation === generationRef.current && mounted) setIsReady(true);
        });
        return () => {
            mounted = false;
            if (generation === generationRef.current && providerRef.current) {
                const active = providerRef.current;
                providerRef.current = null;
                void active.setEnabled(false);
                setSendCredentialFlowProvider(null);
            }
        };
    }, [permitted, consent.identityKey]);

    const value = useMemo(() => ({ provider, isReady }), [provider, isReady]);
    return (
        <AnalyticsContext.Provider value={value}>
            <UserflowConsentLifecycle />
            {children}
        </AnalyticsContext.Provider>
    );
}

/**
 * Hook to access the analytics context.
 * @internal Use useAnalytics() instead for the public API.
 */
export function useAnalyticsContext(): AnalyticsContextValue {
    const context = useContext(AnalyticsContext);

    if (!context) {
        throw new Error('useAnalyticsContext must be used within an AnalyticsContextProvider');
    }

    return context;
}

/**
 * Main hook for tracking analytics events.
 * Provides type-safe methods for tracking, identifying users, and page views.
 */
export function useAnalytics() {
    const { provider, isReady } = useAnalyticsContext();

    const track = useCallback(
        async <E extends AnalyticsEventName>(event: E, properties: EventPayload<E>) => {
            await provider.track(event, properties);
        },
        [provider]
    );

    const identify = useCallback(
        async (userId: string, traits?: Record<string, unknown>) => {
            await provider.identify(userId, traits);
        },
        [provider]
    );

    const submitFeedbackIdea = useCallback(
        async (properties: FeedbackIdeaPayload) => {
            if (provider.name !== 'noop') {
                await provider.submitFeedbackIdea(properties);
                return;
            }
            // User-submitted ideas use the dedicated anonymous endpoint and do
            // not initialize PostHog or enable its passive collection queues.
            const feedbackProvider = await loadProvider(() => false);
            await feedbackProvider.submitFeedbackIdea(properties);
        },
        [provider]
    );

    const page = useCallback(
        async (name: string, properties?: Record<string, unknown>) => {
            await provider.page(name, properties);
        },
        [provider]
    );

    const reset = useCallback(async () => {
        await provider.reset();
    }, [provider]);

    const setEnabled = useCallback(
        async (enabled: boolean) => {
            await provider.setEnabled(enabled);
        },
        [provider]
    );

    return {
        track,
        submitFeedbackIdea,
        identify,
        page,
        reset,
        setEnabled,
        isReady,
        providerName: provider.name,
    };
}
