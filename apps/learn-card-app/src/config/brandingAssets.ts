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
import DefaultDesktopLoginBg from '../assets/images/desktop-login-bg.png';
import DefaultDesktopLoginBgAlt from '../assets/images/desktop-login-bg-alt.png';

export interface ResolvedBrandingAssets {
    textLogo: string;
    /** Dark variant for light backgrounds. Undefined when not configured. */
    textLogoDark: string | undefined;
    brandMark: string;
    appIcon: string;
    desktopLoginBg: string;
    desktopLoginBgAlt: string;
}

/**
 * Resolve branding asset URLs with bundled defaults.
 * Pure function — can be used outside React if you have the raw BrandingAssets.
 */
export const resolveAssets = (assets: BrandingAssets): ResolvedBrandingAssets => ({
    textLogo: assets.textLogoUrl ?? DefaultTextLogo,
    textLogoDark: assets.textLogoDarkUrl,
    brandMark: assets.brandMarkUrl ?? DefaultBrandMark,
    appIcon: assets.appIconUrl ?? DefaultAppIcon,
    desktopLoginBg: assets.desktopLoginBgUrl ?? DefaultDesktopLoginBg,
    desktopLoginBgAlt: assets.desktopLoginBgAltUrl ?? DefaultDesktopLoginBgAlt,
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
        assets.appIconUrl,
        assets.desktopLoginBgUrl,
        assets.desktopLoginBgAltUrl,
    ]);
};
