/**
 * i18n foundation for @learncard/email-templates (LC-1902, workstream C1).
 *
 * Mirrors the dependency-free per-locale dictionary pattern used by the C2
 * notification catalog (`brain-service/src/helpers/notificationMessages.ts`).
 *
 * This module owns:
 *   - `NotificationLocale` — the union of supported locales (en/es/fr/ar).
 *   - `resolveCatalogLocale()` — narrow a runtime BCP-47 string to a supported
 *     locale, falling back to `'en'`. Never throws.
 *   - `SHARED` — strings shared across templates via the `Layout` /
 *     `LinkFallback` chrome (footer disclaimer, "Contact Support", the
 *     link-fallback hint). Keeps the shared chrome DRY.
 *
 * Brand values (`brandName`, `appUrl`, `copyrightHolder`, …) are intentionally
 * NOT in this catalog — they stay interpolated from `TenantBranding`.
 */

/** Locales supported by the email/SMS catalogs. */
export type NotificationLocale = 'en' | 'es' | 'fr' | 'ar';

const DEFAULT_LOCALE: NotificationLocale = 'en';

const SUPPORTED_LOCALES = new Set<NotificationLocale>(['en', 'es', 'fr', 'ar']);

/**
 * Narrow an arbitrary runtime locale string (BCP-47, e.g. `es`, `es-MX`) down
 * to one of the supported catalog locales. Falls back to `'en'`.
 *
 * Accepts `string | undefined` so callers can pass through optional values
 * (e.g. a missing recipient locale) without a guard.
 */
export const resolveCatalogLocale = (locale?: string | null): NotificationLocale => {
    if (typeof locale !== 'string' || locale.length === 0) return DEFAULT_LOCALE;
    const base = locale.toLowerCase().split('-')[0] as NotificationLocale;
    return SUPPORTED_LOCALES.has(base) ? base : DEFAULT_LOCALE;
};

/**
 * Map a supported locale to the value for the top-level `<Html lang>`
 * attribute. BCP-47 base tag is sufficient for email clients / RTL handling.
 */
export const htmlLang = (locale?: string | null): string => resolveCatalogLocale(locale);

/** Locales that render right-to-left. */
const RTL_LOCALES = new Set<NotificationLocale>(['ar']);

/**
 * Text direction for the top-level `<Html dir>` attribute. Arabic renders
 * right-to-left; everything else left-to-right. Email clients need an explicit
 * `dir="rtl"` to flip alignment, punctuation, and layout for RTL languages.
 */
export const htmlDir = (locale?: string | null): 'ltr' | 'rtl' =>
    RTL_LOCALES.has(resolveCatalogLocale(locale)) ? 'rtl' : 'ltr';

// ---------------------------------------------------------------------------
// Shared chrome strings (Layout footer, LinkFallback hint)
// ---------------------------------------------------------------------------

export interface SharedChromeStrings {
    /** Footer disclaimer shown on every email (uses {brandName}). */
    footerDisclaimer: string;
    /** "Contact Support" link text in the footer. */
    contactSupport: string;
    /** Hint above the copy/paste link fallback. */
    linkFallbackHint: string;
}

export const SHARED: Record<NotificationLocale, SharedChromeStrings> = {
    en: {
        footerDisclaimer:
            'You received this email because someone requested to add this email to their {brandName} account. Please ignore this email if this was not you.',
        contactSupport: 'Contact Support',
        linkFallbackHint:
            'If you have trouble with the button above, copy and paste this link into your browser:',
    },
    es: {
        footerDisclaimer:
            'Recibiste este correo porque alguien solicitó añadir este correo a su cuenta de {brandName}. Ignora este mensaje si no fuiste tú.',
        contactSupport: 'Contactar con soporte',
        linkFallbackHint:
            'Si tienes problemas con el botón anterior, copia y pega este enlace en tu navegador:',
    },
    fr: {
        footerDisclaimer:
            'Vous avez reçu cet e-mail car quelqu\u2019un a demandé à ajouter cette adresse e-mail à son compte {brandName}. Veuillez ignorer cet e-mail si vous n\u2019êtes pas à l\u2019origine de cette demande.',
        contactSupport: 'Contacter le support',
        linkFallbackHint:
            'Si le bouton ci-dessus ne fonctionne pas, copiez et collez ce lien dans votre navigateur :',
    },
    ar: {
        footerDisclaimer:
            'لقد تلقيت هذه الرسالة لأن أحدهم طلب إضافة هذا البريد إلى حسابه في {brandName}. يرجى تجاهل هذه الرسالة إذا لم تكن أنت.',
        contactSupport: 'تواصل مع الدعم',
        linkFallbackHint: 'إذا واجهت مشكلة مع الزر أعلاه، انسخ هذا الرابط والصقه في متصفحك:',
    },
};

/** Replace `{var}` placeholders in `template` with values from `params`. */
export const interpolate = (template: string, params: Record<string, string | undefined>): string =>
    template.replace(/\{(\w+)\}/g, (match, key: string) => {
        const value = params[key];
        return value === undefined ? match : value;
    });
