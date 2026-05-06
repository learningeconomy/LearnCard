/**
 * Bootstrap Tenant Config
 *
 * This module wires TenantConfig into all the subsystems that need it
 * before React renders. Call `bootstrapTenantConfig()` once in main.tsx.
 */

import * as Sentry from '@sentry/browser';

import type { TenantConfig } from 'learn-card-base';
import { resolveTenantConfig, setAuthConfigFromTenant, getTenantBaseUrl } from 'learn-card-base';
import { initNetworkStoreFromTenant } from 'learn-card-base';
import { setOnFetchFailure } from 'learn-card-base/config/resolveTenantConfig';

import { initializeFirebaseFromTenant } from '../firebase/firebase';
import { initSentryFromTenant } from '../constants/sentry';
import { initUserflowFromTenant } from '../constants/userflow';
import { enforceDefaultTheme } from '../theme/store/themeStore';
import {
    createConfigResolutionListener,
    emitConfigDebugEvent,
    emitConfigSuccess,
} from '../components/debug/configDebugEvents';

type TenantBootstrapState = {
    resolvedConfig: TenantConfig | null;
    bootstrapPromise: Promise<TenantConfig> | null;
};

const TENANT_BOOTSTRAP_STATE_KEY = '__learncardTenantBootstrapState__';

const getTenantBootstrapState = (): TenantBootstrapState => {
    const globalScope = globalThis as typeof globalThis & {
        [TENANT_BOOTSTRAP_STATE_KEY]?: TenantBootstrapState;
    };

    if (!globalScope[TENANT_BOOTSTRAP_STATE_KEY]) {
        globalScope[TENANT_BOOTSTRAP_STATE_KEY] = {
            resolvedConfig: null,
            bootstrapPromise: null,
        };
    }

    return globalScope[TENANT_BOOTSTRAP_STATE_KEY];
};

// Module-level cache backed by global state so HMR does not clear the resolved config.
let _resolvedConfig: TenantConfig | null = getTenantBootstrapState().resolvedConfig;

const setResolvedTenantConfig = (config: TenantConfig): void => {
    _resolvedConfig = config;
    getTenantBootstrapState().resolvedConfig = config;
};

const initializeTenantSubsystems = (config: TenantConfig): void => {
    // 1. Initialize Firebase with tenant-specific project config
    initializeFirebaseFromTenant(config.auth.firebase);
    emitConfigDebugEvent(
        'bootstrap:firebase_init',
        `Firebase initialized (project: ${config.auth.firebase?.projectId ?? 'default'})`,
        { data: { projectId: config.auth.firebase?.projectId } }
    );

    // 2. Bridge auth config so getAuthConfig() returns tenant-aware values
    setAuthConfigFromTenant(config);
    emitConfigDebugEvent(
        'bootstrap:auth_config_set',
        `Auth config bridged (provider: ${config.auth.provider})`,
        { data: { provider: config.auth.provider, keyDerivation: config.auth.keyDerivation } }
    );

    // 3. Populate network store with tenant API endpoints + tenant ID
    initNetworkStoreFromTenant(config.apis, config.tenantId);
    emitConfigDebugEvent('bootstrap:network_store_init', 'Network store populated with tenant API endpoints');

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
 * Get the resolved TenantConfig synchronously.
 * Only available after `bootstrapTenantConfig()` has been called.
 */
export const getResolvedTenantConfig = (): TenantConfig => {
    const config = _resolvedConfig ?? getTenantBootstrapState().resolvedConfig;

    if (!config) {
        throw new Error('TenantConfig not yet resolved. Call bootstrapTenantConfig() first.');
    }

    _resolvedConfig = config;

    return config;
};

/**
 * Get headers that identify the current tenant to backend services.
 * Merges with any existing headers object so callers can spread or pass directly.
 */
export const getTenantHeaders = (): Record<string, string> => {
    const tenantId = _resolvedConfig?.tenantId;

    if (!tenantId) return {};

    return { 'X-Tenant-Id': tenantId };
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
 *   1. Firebase (from tenant auth.firebase config)
 *   2. Auth config overrides (from tenant auth config)
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

        const config = bootstrapState.resolvedConfig ?? (await resolveTenantConfig({ onEvent }));

        setResolvedTenantConfig(config);
        initializeTenantSubsystems(config);

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
