import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

import { getResolvedTenantLinks, getTenantBaseUrl } from 'learn-card-base/config/tenantConfig';
import { getResolvedTenantConfig } from '../config/bootstrapTenantConfig';

// ---------------------------------------------------------------------------
// Resolved link getters — read from tenant config at call time
// ---------------------------------------------------------------------------

const resolvedLinks = () => getResolvedTenantLinks(getResolvedTenantConfig());

/**
 * Turn a potentially relative path (e.g. `/legal/terms`) into an absolute URL.
 * Needed because Capacitor's Browser.open() requires an absolute URL, and the
 * default legal page links are same-origin paths served by the app.
 */
const resolveUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
        return url;
    }

    const base = getTenantBaseUrl(getResolvedTenantConfig());

    return `${base}${url}`;
};

/** @deprecated Import `useTenantLinks` hook instead for React components */
export const getTosLink = (): string => resolvedLinks().termsOfServiceUrl;

/** @deprecated Import `useTenantLinks` hook instead for React components */
export const getPpLink = (): string => resolvedLinks().privacyPolicyUrl;

/** @deprecated Import `useTenantLinks` hook instead for React components */
export const getContactLink = (): string => resolvedLinks().contactUrl;

/** @deprecated Import `useTenantLinks` hook instead for React components */
export const getWebsiteLink = (): string => resolvedLinks().websiteUrl;

// Backward-compat constants — these are evaluated lazily via getters so they
// resolve from tenant config. Use the getter functions or useTenantLinks hook
// in new code instead.
export const TOS_LINK = 'https://www.learncard.com/learncard-terms-of-service';
export const PP_LINK = 'https://www.learncard.com/learncard-privacy-policy';
export const CONTACT_LINK = 'https://www.learningeconomy.io/contact';
export const MV_TYPEFORM = 'https://r18y4ggjlxv.typeform.com/to/fBWigxQx'; // Request Metaversity at Your School
export const LEARNCARD_WEBSITE = 'https://www.learncard.com/';
export const DEVELOPER_DOCS = 'https://docs.learncard.com/';

// ---------------------------------------------------------------------------
// Open helpers — use resolved tenant links
// ---------------------------------------------------------------------------

export const openExternalLink = async (url: string) => {
    const resolved = resolveUrl(url);

    if (Capacitor?.isNativePlatform()) {
        await Browser?.open({ url: resolved });
    } else {
        window?.open(resolved, '_blank', 'noopener,noreferrer');
    }
};

export const openLCwebsite = async () => {
    const url = resolveUrl(getWebsiteLink());

    if (Capacitor?.isNativePlatform()) {
        await Browser?.open({ url });
    } else {
        window?.open(url, '_blank', 'noopener,noreferrer');
    }
};

export const openToS = async () => {
    const url = resolveUrl(getTosLink());

    if (Capacitor?.isNativePlatform()) {
        await Browser?.open({ url });
    } else {
        window?.open(url, '_blank', 'noopener,noreferrer');
    }
};

export const openPP = async () => {
    const url = resolveUrl(getPpLink());

    if (Capacitor.isNativePlatform()) {
        await Browser?.open({ url });
    } else {
        window?.open(url, '_blank', 'noopener,noreferrer');
    }
};

export const openContactLink = async () => {
    const url = resolveUrl(getContactLink());

    if (Capacitor.isNativePlatform()) {
        await Browser?.open({ url });
    } else {
        window?.open(url, '_blank', 'noopener,noreferrer');
    }
};

export const openDeveloperDocs = async () => {
    if (Capacitor.isNativePlatform()) {
        await Browser?.open({ url: DEVELOPER_DOCS });
    } else {
        window?.open(DEVELOPER_DOCS, '_blank', 'noopener,noreferrer');
    }
};
