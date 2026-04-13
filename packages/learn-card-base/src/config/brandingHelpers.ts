/**
 * Data-driven branding helpers.
 *
 * These functions read from `TenantBrandingConfig` so components can
 * stop switching on `BrandingEnum`. During migration, components can
 * call these helpers with the resolved TenantConfig and fall back to
 * BrandingEnum-based logic for anything not yet covered.
 */

import type { TenantBrandingConfig } from './tenantConfig';
import { BrandingEnum } from '../components/headerBranding/headerBrandingHelpers';

// -----------------------------------------------------------------
// BrandingEnum compatibility bridge
// -----------------------------------------------------------------

/**
 * Derive the legacy BrandingEnum value from a TenantBrandingConfig.
 *
 * This lets existing component code that switches on BrandingEnum work
 * without modification — the enum value is derived from `brandingKey`
 * in the tenant config.
 *
 * For new tenants whose brandingKey doesn't map to an enum member,
 * defaults to `BrandingEnum.learncard` so all LearnCard-like behavior applies.
 */
export const getTenantBrandingEnum = (branding: TenantBrandingConfig): BrandingEnum => {
    const key = branding.brandingKey;

    if (key && key in BrandingEnum) {
        return BrandingEnum[key as keyof typeof BrandingEnum];
    }

    return BrandingEnum.learncard;
};

/**
 * Get the display label for a credential category.
 * Returns the override from config, or the raw category key as fallback.
 */
export const getCategoryLabel = (
    branding: TenantBrandingConfig,
    categoryKey: string
): string => {
    return branding.categoryLabels?.[categoryKey] ?? categoryKey;
};

/**
 * Get the color override for a credential category.
 * Returns undefined if no override exists (caller should use its own default).
 */
export const getCategoryColor = (
    branding: TenantBrandingConfig,
    categoryKey: string
): string | undefined => {
    return branding.categoryColors?.[categoryKey];
};

/**
 * Get the nav bar background color for a given route path.
 * Returns undefined if no override exists.
 */
export const getNavBarColorOverride = (
    branding: TenantBrandingConfig,
    path: string
): string | undefined => {
    if (!branding.navBarColors) return undefined;

    // Exact match first
    if (branding.navBarColors[path]) return branding.navBarColors[path];

    // Prefix match (e.g. "/share-boost" matches "/share-boost/123")
    for (const [route, color] of Object.entries(branding.navBarColors)) {
        if (path.startsWith(route)) return color;
    }

    return undefined;
};

/**
 * Get the status bar color for a given route path.
 * Returns undefined if no override exists.
 */
export const getStatusBarColorOverride = (
    branding: TenantBrandingConfig,
    path: string
): string | undefined => {
    if (!branding.statusBarColors) return undefined;

    if (branding.statusBarColors[path]) return branding.statusBarColors[path];

    for (const [route, color] of Object.entries(branding.statusBarColors)) {
        if (path.startsWith(route)) return color;
    }

    return undefined;
};

/**
 * Get the header text color for a given route path.
 * Returns the default header text color if no route-specific override matches.
 */
export const getHeaderTextColor = (
    branding: TenantBrandingConfig,
    path: string
): string | undefined => {
    if (branding.headerTextColors?.[path]) return branding.headerTextColors[path];

    if (branding.headerTextColors) {
        for (const [route, color] of Object.entries(branding.headerTextColors)) {
            if (path.startsWith(route) || path.includes(route)) return color;
        }
    }

    return branding.defaultHeaderTextColor;
};

/**
 * Get the home route for the tenant.
 */
export const getHomeRoute = (branding: TenantBrandingConfig): string => {
    return branding.homeRoute ?? '/wallet';
};

/**
 * Get the header display text for the tenant.
 */
export const getHeaderText = (branding: TenantBrandingConfig): string => {
    return branding.headerText ?? branding.name.toUpperCase();
};

// -----------------------------------------------------------------
// Branding asset URLs
// -----------------------------------------------------------------

export interface BrandingAssets {
    /**
     * Wordmark only (text, no icon) — light/white variant for dark backgrounds.
     * Used on: loading page, intro slides, login page (colored bg).
     */
    textLogoUrl: string | undefined;

    /**
     * Wordmark only (text, no icon) — dark variant for light backgrounds.
     * Used on: side menu header, AI sessions desktop header (white bg).
     */
    textLogoDarkUrl: string | undefined;

    /**
     * Icon / brand mark — dark variant for light backgrounds.
     * Used on: login page hero, approve account, credential request cards.
     * This is the "primary" icon; use on white or light-colored surfaces.
     */
    brandMarkUrl: string | undefined;

    /**
     * Icon / brand mark — light/white variant for dark backgrounds.
     * Used on: loading page, intro slides, any surface with a dark or
     * colored background. Falls back to brandMarkUrl if not provided.
     */
    brandMarkLightUrl: string | undefined;

    /** Small app icon (icon + bg color in a rounded square). Used in loaders, consent flow, onboarding. */
    appIconUrl: string | undefined;

    /** Desktop login page background image. */
    desktopLoginBgUrl: string | undefined;

    /** Alternate desktop login background (endorsement modals, etc.). */
    desktopLoginBgAltUrl: string | undefined;

    /** Favicon URL for web. */
    faviconUrl: string | undefined;

    /**
     * Full lockup logo (icon + wordmark combined) — for light backgrounds.
     * Used for: og:image, share cards, external embeds.
     * If not set, the app composes brandMark + textLogo at render time.
     */
    fullLogoUrl: string | undefined;

    /**
     * Full lockup logo (icon + wordmark combined) — for dark backgrounds.
     * Used for: splash screens, share cards on dark surfaces.
     * Falls back to fullLogoUrl if not provided.
     */
    fullLogoDarkUrl: string | undefined;

    /** @deprecated Use fullLogoUrl instead. General logo URL (og:image, share cards). */
    logoUrl: string | undefined;
}

/**
 * Extract branding asset URLs from a TenantBrandingConfig.
 *
 * Returns `undefined` for any field not configured — callers should
 * provide their own bundled fallback (e.g. a static import).
 */
export const getBrandingAssets = (branding: TenantBrandingConfig): BrandingAssets => ({
    textLogoUrl: branding.textLogoUrl,
    textLogoDarkUrl: branding.textLogoDarkUrl,
    brandMarkUrl: branding.brandMarkUrl,
    brandMarkLightUrl: branding.brandMarkLightUrl,
    appIconUrl: branding.appIconUrl,
    desktopLoginBgUrl: branding.desktopLoginBgUrl,
    desktopLoginBgAltUrl: branding.desktopLoginBgAltUrl,
    faviconUrl: branding.faviconUrl,
    fullLogoUrl: branding.fullLogoUrl,
    fullLogoDarkUrl: branding.fullLogoDarkUrl,
    logoUrl: branding.logoUrl,
});
