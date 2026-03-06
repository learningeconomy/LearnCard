/**
 * Data-driven branding helpers.
 *
 * These functions read from `TenantBrandingConfig` so components can
 * stop switching on `BrandingEnum`. During migration, components can
 * call these helpers with the resolved TenantConfig and fall back to
 * BrandingEnum-based logic for anything not yet covered.
 */

import type { TenantBrandingConfig } from './tenantConfig';

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
