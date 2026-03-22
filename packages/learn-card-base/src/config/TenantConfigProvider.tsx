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
import { getTenantBrandingEnum, getBrandingAssets } from './brandingHelpers';
import { isProductionEnvironment } from './isProduction';
export type { BrandingAssets } from './brandingHelpers';
export { getBrandingAssets } from './brandingHelpers';

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
 * Derive the legacy BrandingEnum from TenantConfig for backward compat.
 * Use this when passing `branding` props to components that haven't been
 * migrated to fully data-driven branding yet.
 */
export { getTenantBrandingEnum } from './brandingHelpers';

export const useBrandingEnum = () => {
    const branding = useTenantConfig().branding;

    return getTenantBrandingEnum(branding);
};

/**
 * Get tenant-configured branding asset URLs.
 *
 * Returns `undefined` for any asset not configured by the tenant —
 * callers should provide their own bundled fallback via `??`.
 *
 * @example
 * const assets = useBrandingAssets();
 * <img src={assets.textLogoUrl ?? BundledTextLogo} />
 */
export const useBrandingAssets = () => {
    const branding = useTenantConfig().branding;

    return getBrandingAssets(branding);
};

/**
 * Get the tenant's base URL for link generation.
 * Uses the full config to determine production vs dev domain.
 */
export const useTenantBaseUrl = (): string => {
    const config = useTenantConfig();

    if (isProductionEnvironment()) {
        return `https://${config.domain}`;
    }

    return `http://${config.devDomain ?? 'localhost:3000'}`;
};

/**
 * Get the tenant's login redirect URL (base URL + loginRedirectPath).
 * Replaces the legacy `LOGIN_REDIRECTS[BrandingEnum]` + `IS_PRODUCTION` pattern.
 */
export const useLoginRedirectUrl = (): string => {
    const config = useTenantConfig();
    const baseUrl = useTenantBaseUrl();
    const path = config.branding.loginRedirectPath ?? '/waitingsofa?loginCompleted=true';

    return `${baseUrl}${path}`;
};

