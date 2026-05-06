/**
 * Tenant branding for email and SMS templates.
 *
 * Values are typically sourced from the tenant config's `email` section.
 * Every field has a sensible LearnCard default so templates always render,
 * even if the caller provides a partial (or empty) branding object.
 */

export interface TenantBranding {
    /** Display name shown in email headers, subject lines, and SMS. */
    brandName: string;

    /** Full URL to a hosted logo image (PNG/SVG, ideally 200×50 or similar). */
    logoUrl: string;

    /** Alt text for the logo image. */
    logoAlt: string;

    /** Primary brand color (hex). Used for CTA buttons and accents. */
    primaryColor: string;

    /** Text color on primary buttons. */
    primaryTextColor: string;

    /** Support / reply-to email address shown in footers. */
    supportEmail: string;

    /** Marketing website URL shown in footers. */
    websiteUrl: string;

    /** Base app URL for constructing links (e.g. "https://learncard.app"). */
    appUrl: string;

    /** Email domain for the From address (e.g. "learncard.com"). */
    fromDomain: string;

    /** Copyright holder name for the footer. */
    copyrightHolder: string;
}

export const DEFAULT_BRANDING: TenantBranding = {
    brandName: 'LearnCard',
    logoUrl: 'https://learncard.app/assets/icon/icon.png',
    logoAlt: 'LearnCard',
    primaryColor: '#6366f1',
    primaryTextColor: '#ffffff',
    supportEmail: 'support@learningeconomy.io',
    websiteUrl: 'https://www.learncard.com',
    appUrl: 'https://learncard.app',
    fromDomain: 'learncard.com',
    copyrightHolder: 'Learning Economy Foundation',
};

/**
 * Merge partial branding with defaults.
 * Any missing field falls back to the LearnCard default.
 */
export const resolveBranding = (partial?: Partial<TenantBranding>): TenantBranding => ({
    ...DEFAULT_BRANDING,
    ...partial,
});
