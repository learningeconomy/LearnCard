import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

import type { AnalyticsProvider, AnalyticsProviderName } from './types';
import type { AnalyticsEventName, EventPayload } from './events';
import { NoopProvider } from './providers/noop';

/**
 * Lazily load and instantiate the appropriate analytics provider based on env config.
 */
async function loadProvider(): Promise<AnalyticsProvider> {
    const providerName = (
        import.meta.env.VITE_ANALYTICS_PROVIDER || 'noop'
    ) as AnalyticsProviderName;

    switch (providerName) {
        case 'posthog': {
            const apiKey = import.meta.env.VITE_POSTHOG_KEY;

            if (!apiKey) {
                console.warn('[Analytics] PostHog selected but VITE_POSTHOG_KEY not set, falling back to noop');
                return new NoopProvider();
            }

            const { PostHogProvider } = await import('./providers/posthog');

            return new PostHogProvider({
                apiKey,
                apiHost: import.meta.env.VITE_POSTHOG_HOST,
            });
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

interface AnalyticsContextValue {
    provider: AnalyticsProvider;
    isReady: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
    children: React.ReactNode;
}

/**
 * Analytics provider component that lazily loads the configured analytics backend.
 * Wrap your app with this provider to enable analytics throughout.
 */
export function AnalyticsContextProvider({ children }: AnalyticsProviderProps) {
    const [provider, setProvider] = useState<AnalyticsProvider>(() => new NoopProvider());
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let mounted = true;

        loadProvider()
            .then(async loadedProvider => {
                if (!mounted) return;

                await loadedProvider.init();

                if (!mounted) return;

                setProvider(loadedProvider);
                setIsReady(true);
            })
            .catch(error => {
                console.error('[Analytics] Failed to load provider', error);

                if (mounted) {
                    setIsReady(true);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    const value = useMemo(() => ({ provider, isReady }), [provider, isReady]);

    return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
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
        identify,
        page,
        reset,
        setEnabled,
        isReady,
        providerName: provider.name,
    };
}
