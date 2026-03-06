import React, { createContext, useContext } from 'react';

import type {
    TenantConfig,
    TenantApiConfig,
    TenantAuthConfig,
    TenantBrandingConfig,
    TenantFeatureConfig,
    TenantObservabilityConfig,
    TenantLinksConfig,
    TenantNativeConfig,
} from './tenantConfig';

// -----------------------------------------------------------------
// Context
// -----------------------------------------------------------------

const TenantConfigContext = createContext<TenantConfig | null>(null);

// -----------------------------------------------------------------
// Provider
// -----------------------------------------------------------------

export interface TenantConfigProviderProps {
    config: TenantConfig;
    children: React.ReactNode;
}

export const TenantConfigProvider: React.FC<TenantConfigProviderProps> = ({ config, children }) => {
    return (
        <TenantConfigContext.Provider value={config}>
            {children}
        </TenantConfigContext.Provider>
    );
};

// -----------------------------------------------------------------
// Hooks
// -----------------------------------------------------------------

/**
 * Access the full TenantConfig. Throws if used outside <TenantConfigProvider>.
 */
export const useTenantConfig = (): TenantConfig => {
    const config = useContext(TenantConfigContext);

    if (!config) {
        throw new Error('useTenantConfig must be used within a <TenantConfigProvider>');
    }

    return config;
};

/** API endpoint configuration */
export const useApiConfig = (): TenantApiConfig => useTenantConfig().apis;

/** Auth provider + key derivation configuration */
export const useAuthTenantConfig = (): TenantAuthConfig => useTenantConfig().auth;

/** Visual identity / branding configuration */
export const useBrandingConfig = (): TenantBrandingConfig => useTenantConfig().branding;

/** Feature toggles */
export const useFeatureConfig = (): TenantFeatureConfig => useTenantConfig().features;

/** Observability (Sentry, analytics) configuration */
export const useObservabilityConfig = (): TenantObservabilityConfig => useTenantConfig().observability;

/** External links (App Store, Play Store) */
export const useLinksConfig = (): TenantLinksConfig => useTenantConfig().links;

/** Native build-time config (may be undefined on web) */
export const useNativeConfig = (): TenantNativeConfig | undefined => useTenantConfig().native;

/**
 * Get the tenant's base URL for link generation.
 * Uses the full config to determine production vs dev domain.
 */
export const useTenantBaseUrl = (): string => {
    const config = useTenantConfig();

    const isProduction =
        // eslint-disable-next-line no-restricted-globals
        (typeof IS_PRODUCTION !== 'undefined' && (IS_PRODUCTION as unknown as boolean)) ||
        (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');

    if (isProduction) {
        return `https://${config.domain}`;
    }

    return `http://${config.devDomain ?? 'localhost:3000'}`;
};

// Ambient declaration so TypeScript doesn't error on the typeof guard above.
declare const IS_PRODUCTION: boolean | undefined;
