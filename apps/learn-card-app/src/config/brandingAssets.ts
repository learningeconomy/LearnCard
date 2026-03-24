/**
 * Resolved branding assets with bundled fallbacks.
 *
 * Components should import `useTenantBrandingAssets()` from this file
 * instead of importing static image files directly. When a tenant
 * configures a custom asset URL, it wins; otherwise the bundled
 * LearnCard default is used.
 */

import { useMemo } from 'react';

import { useBrandingAssets } from 'learn-card-base/config/TenantConfigProvider';
import type { BrandingAssets } from 'learn-card-base/config/TenantConfigProvider';

// Bundled LearnCard defaults (Vite resolves these to hashed asset URLs)
import DefaultTextLogo from '../assets/images/learncard-text-logo.svg';
import DefaultBrandMark from '../assets/images/lca-brandmark.png';
import DefaultAppIcon from '../assets/images/lca-icon-v2.png';
// DefaultDesktopLoginBg and DefaultDesktopLoginBgAlt removed —
// tenants without custom desktop bg images now show LoginWelcomePanel instead.

export interface ResolvedBrandingAssets {
    /** Wordmark (text only) for dark backgrounds — white/light text. */
    textLogo: string;

    /** Wordmark (text only) for light backgrounds — dark text. Undefined when not configured. */
    textLogoDark: string | undefined;

    /** Icon / brand mark for light backgrounds (dark icon). */
    brandMark: string;

    /** Icon / brand mark for dark backgrounds (light/white icon). Falls back to brandMark. */
    brandMarkLight: string;

    /** Small app icon (icon + bg color in rounded square). */
    appIcon: string;

    /** Desktop login background. Undefined when tenant doesn't provide one. */
    desktopLoginBg: string | undefined;

    /** Alternate desktop login background. Undefined when tenant doesn't provide one. */
    desktopLoginBgAlt: string | undefined;

    /** Full lockup (icon + wordmark) for light backgrounds. Undefined when not configured. */
    fullLogo: string | undefined;

    /** Full lockup (icon + wordmark) for dark backgrounds. Undefined when not configured. */
    fullLogoDark: string | undefined;
}

/**
 * Resolve branding asset URLs with bundled defaults.
 * Pure function — can be used outside React if you have the raw BrandingAssets.
 */
export const resolveAssets = (assets: BrandingAssets): ResolvedBrandingAssets => ({
    textLogo: assets.textLogoUrl ?? DefaultTextLogo,
    textLogoDark: assets.textLogoDarkUrl,
    brandMark: assets.brandMarkUrl ?? DefaultBrandMark,
    brandMarkLight: assets.brandMarkLightUrl ?? assets.brandMarkUrl ?? DefaultBrandMark,
    appIcon: assets.appIconUrl ?? DefaultAppIcon,
    desktopLoginBg: assets.desktopLoginBgUrl,
    desktopLoginBgAlt: assets.desktopLoginBgAltUrl,
    fullLogo: assets.fullLogoUrl ?? assets.logoUrl,
    fullLogoDark: assets.fullLogoDarkUrl ?? assets.fullLogoUrl ?? assets.logoUrl,
});

/**
 * React hook — returns fully resolved branding asset URLs.
 *
 * @example
 * const { textLogo, brandMark, appIcon } = useTenantBrandingAssets();
 * <img src={textLogo} alt="Logo" />
 */
export const useTenantBrandingAssets = (): ResolvedBrandingAssets => {
    const assets = useBrandingAssets();

    return useMemo(() => resolveAssets(assets), [
        assets.textLogoUrl,
        assets.textLogoDarkUrl,
        assets.brandMarkUrl,
        assets.brandMarkLightUrl,
        assets.appIconUrl,
        assets.desktopLoginBgUrl,
        assets.desktopLoginBgAltUrl,
        assets.fullLogoUrl,
        assets.fullLogoDarkUrl,
        assets.logoUrl,
    ]);
};
