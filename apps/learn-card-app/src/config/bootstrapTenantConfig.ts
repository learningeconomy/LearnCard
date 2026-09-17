/**
 * Bootstrap Tenant Config
 *
 * This module wires TenantConfig into all the subsystems that need it
 * before React renders. Call `bootstrapTenantConfig()` once in main.tsx.
 */

import * as Sentry from '@sentry/browser';
import { Capacitor } from '@capacitor/core';

import type { TenantConfig } from 'learn-card-base';
import {
    resolveTenantConfig,
    setAuthConfigFromTenant,
    setImageUploadConfigFromTenant,
    getTenantBaseUrl,
    getAuthConfig,
    initializeAuthProvider,
} from 'learn-card-base';
import { initNetworkStoreFromTenant } from 'learn-card-base';
import { setOnFetchFailure } from 'learn-card-base/config/resolveTenantConfig';

import { initSentryFromTenant } from '../constants/sentry';
import { initUserflowFromTenant } from '../constants/userflow';
import { enforceDefaultTheme } from '../theme/store/themeStore';
import {
    createConfigResolutionListener,
    emitConfigDebugEvent,
    emitConfigSuccess,
} from '../components/debug/configDebugEvents';
import {
    getTenantBootstrapState,
    setResolvedTenantConfig,
    getResolvedTenantConfig,
    getTenantHeaders,
} from './tenantConfigState';

// Re-exported from the dependency-free state module so modules that only read
// the resolved config can import them without pulling in this heavy graph.
export { getResolvedTenantConfig, getTenantHeaders };

const initializeTenantSubsystems = async (config: TenantConfig): Promise<void> => {
    // 1. Bridge auth config so getAuthConfig() returns tenant-aware values.
    // Must run before initializeAuthProvider() so it resolves the tenant's
    // actual provider instead of the default.
    setAuthConfigFromTenant(config);
    emitConfigDebugEvent(
        'bootstrap:auth_config_set',
        `Auth config bridged (provider: ${config.auth.provider})`,
        { data: { provider: config.auth.provider, keyDerivation: config.auth.keyDerivation } }
    );

    // 2. Run the provider-specific SDK bootstrap (e.g. Firebase's initializeApp
    // + analytics). Only the initializer registered for config.auth.provider
    // runs, so a non-Firebase tenant never touches the Firebase SDK.
    await initializeAuthProvider(getAuthConfig());
    emitConfigDebugEvent(
        'bootstrap:auth_provider_init',
        `Auth provider initialized (provider: ${config.auth.provider}${
            config.auth.provider === 'firebase'
                ? `, project: ${config.auth.firebase?.projectId ?? 'default'}`
                : ''
        })`,
        { data: { provider: config.auth.provider, projectId: config.auth.firebase?.projectId } }
    );

    setImageUploadConfigFromTenant(config);
    emitConfigDebugEvent(
        'bootstrap:image_upload_config_set',
        `Image upload config bridged (provider: ${config.storage.provider})`,
        { data: { provider: config.storage.provider } }
    );

    // 3. Populate network store with tenant API endpoints + tenant ID
    initNetworkStoreFromTenant(config.apis, config.tenantId);
    emitConfigDebugEvent(
        'bootstrap:network_store_init',
        'Network store populated with tenant API endpoints'
    );

    // 4. Initialize Sentry from tenant observability config
    initSentryFromTenant();
    emitConfigDebugEvent(
        'bootstrap:sentry_init',
        `Sentry initialized (DSN: ${config.observability.sentryDsn ? 'configured' : 'none'})`
    );

    // 5. Initialize Userflow from tenant observability config
    initUserflowFromTenant();
    emitConfigDebugEvent(
        'bootstrap:userflow_init',
        `Userflow initialized (token: ${
            config.observability.userflowToken ? 'configured' : 'none'
        })`
    );

    // 6. Force theme to defaultTheme when tenant disables theme switching
    enforceDefaultTheme();
    emitConfigDebugEvent(
        'bootstrap:theme_enforced',
        `Theme enforcement ran (default: ${config.branding.defaultTheme})`,
        {
            data: {
                defaultTheme: config.branding.defaultTheme,
                themeSwitching: config.features.themeSwitching,
            },
        }
    );
};

/**
 * Get the base URL for the current tenant (e.g. `https://learncard.app` or `http://localhost:3000`).
 * Synchronous helper for use outside React components.
 */
export const getAppBaseUrl = (): string => {
    return getTenantBaseUrl(getResolvedTenantConfig());
};

/**
 * Get the full login redirect URL for the current tenant.
 * Combines the tenant base URL with `branding.loginRedirectPath`.
 *
 * Replaces the legacy `LOGIN_REDIRECTS[BrandingEnum.xxx]` + `IS_PRODUCTION` pattern.
 */
export const getLoginRedirectUrl = (): string => {
    const config = getResolvedTenantConfig();
    const base = getTenantBaseUrl(config);
    const path = config.branding.loginRedirectPath ?? '/waitingsofa?loginCompleted=true';

    return `${base}${path}`;
};

/**
 * Get the Firebase redirect domain for the current tenant.
 * Falls back to the tenant's production domain.
 *
 * Replaces the hardcoded `FIREBASE_REDIRECT_URL` constant.
 */
export const getFirebaseRedirectDomain = (): string => {
    const config = getResolvedTenantConfig();

    return config.auth.firebase?.redirectDomain ?? config.domain;
};

/**
 * Get the Firebase dynamic link domain for the current tenant.
 * Falls back to the tenant's production domain.
 */
export const getFirebaseDynamicLinkDomain = (): string => {
    const config = getResolvedTenantConfig();

    return config.auth.firebase?.dynamicLinkDomain ?? config.domain;
};

/**
 * Get the native bundle ID for the current tenant.
 * Falls back to the default LearnCard bundle ID.
 */
export const getNativeBundleId = (): string => {
    const config = getResolvedTenantConfig();

    return config.native?.bundleId ?? 'com.learncard.app';
};

/**
 * Get the LCN (LearnCard Network) API URL for the current tenant.
 * Falls back to the default network API endpoint.
 */
export const getLCNApiUrl = (): string => {
    const config = getResolvedTenantConfig();

    // Use the brainServiceApi from tenant config (this is what becomes networkApiUrl in the store)
    // or fallback to default
    return config.apis?.brainServiceApi ?? 'https://network.learncard.com/api';
};

/**
 * Resolve the TenantConfig and initialize all subsystems.
 *
 * Call this once before ReactDOM.createRoot().render().
 *
 * Initializes:
 *   1. Auth config overrides (from tenant auth config)
 *   2. The configured auth provider's SDK (e.g. Firebase, from tenant
 *      auth.firebase config) — gated by initializeAuthProvider()
 *   3. Network store (from tenant APIs config)
 *   4. Sentry error tracking
 *   5. Userflow product tours
 */
export const bootstrapTenantConfig = async (): Promise<TenantConfig> => {
    const bootstrapState = getTenantBootstrapState();

    if (bootstrapState.bootstrapPromise) {
        return bootstrapState.bootstrapPromise;
    }

    const onEvent = createConfigResolutionListener();

    emitConfigDebugEvent('bootstrap:start', 'Starting tenant config bootstrap');

    // Wire Sentry breadcrumbs for config fetch failures (before resolving)
    setOnFetchFailure(({ endpoint, error }) => {
        Sentry.addBreadcrumb({
            category: 'tenant-config',
            message: `fetchFreshConfig failed: ${error}`,
            level: 'warning',
            data: { endpoint },
        });
    });

    bootstrapState.bootstrapPromise = (async () => {
        const t0 = Date.now();

        // The `/__tenant-config` overlay is a Netlify edge function that only exists on
        // web origins. Native webviews (capacitor://localhost) have no such route and
        // SPA-fallback it to index.html, so native boots from the baked config only.
        const isNative = Capacitor.isNativePlatform();

        const config =
            bootstrapState.resolvedConfig ??
            (await resolveTenantConfig({ onEvent, offlineOnly: isNative }));

        setResolvedTenantConfig(config);
        await initializeTenantSubsystems(config);

        const totalMs = Date.now() - t0;

        emitConfigSuccess(
            'bootstrap:complete',
            `Bootstrap complete in ${totalMs}ms — tenant: ${config.tenantId}`,
            { tenantId: config.tenantId, totalMs }
        );

        return config;
    })();

    try {
        return await bootstrapState.bootstrapPromise;
    } finally {
        bootstrapState.bootstrapPromise = null;
    }
};
