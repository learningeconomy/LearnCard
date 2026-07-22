/**
 * SMS template rendering — tenant-aware replacement for sms.helpers.ts.
 *
 * Replaces the hardcoded "LearnCard" in SMS text with the tenant's brand name
 * and renders localized SMS bodies (LC-1902, workstream C1).
 */

import type { TenantBranding } from './branding';
import { resolveBranding } from './branding';
import type { NotificationLocale } from './i18n';
import { resolveCatalogLocale } from './i18n';

// ---------------------------------------------------------------------------
// SMS template data shapes
// ---------------------------------------------------------------------------

export interface SmsInboxClaimData {
    claimUrl: string;
    recipient?: { name?: string };
    issuer?: { name?: string };
    credential?: { name?: string; type?: string };
}

export interface SmsVerificationData {
    verificationToken: string;
}

export type SmsTemplateId = 'inbox-claim' | 'contact-method-verification';

export interface SmsTemplateDataMap {
    'inbox-claim': SmsInboxClaimData;
    'contact-method-verification': SmsVerificationData;
}

// ---------------------------------------------------------------------------
// Per-locale SMS copy. EN values byte-match the originals in sms.helpers.ts.
// ---------------------------------------------------------------------------

const INBOX_CLAIM: Record<
    NotificationLocale,
    {
        greetingName: (name: string) => string;
        body: (credType: string, credName: string, issuerName: string | undefined) => string;
        cta: string;
    }
> = {
    en: {
        greetingName: name => `Hello, ${name}! `,
        body: (credType, credName, issuerName) =>
            `You have a new ${credType}, "${credName}"${issuerName ? ` from ${issuerName}.` : '.'}`,
        cta: 'Claim it here:',
    },
    es: {
        greetingName: name => `¡Hola, ${name}! `,
        body: (credType, credName, issuerName) =>
            `Tienes un nuevo ${credType}, "${credName}"${issuerName ? ` de ${issuerName}.` : '.'}`,
        cta: 'Reclámalo aquí:',
    },
    fr: {
        greetingName: name => `Bonjour ${name} ! `,
        body: (credType, credName, issuerName) =>
            `Vous avez un nouveau ${credType}, « ${credName} »${
                issuerName ? ` de ${issuerName}.` : '.'
            }`,
        cta: 'Réclamez-le ici :',
    },
    ar: {
        greetingName: name => `مرحبًا ${name}! `,
        body: (credType, credName, issuerName) =>
            `لديك ${credType} جديد، "${credName}"${issuerName ? ` من ${issuerName}.` : '.'}`,
        cta: 'طالب به هنا:',
    },
};

const VERIFICATION: Record<NotificationLocale, (brandName: string) => string> = {
    en: b => `Your ${b} verification code is:`,
    es: b => `Tu código de verificación de ${b} es:`,
    fr: b => `Votre code de vérification ${b} est :`,
    ar: b => `رمز التحقق الخاص بك في ${b} هو:`,
};

// ---------------------------------------------------------------------------
// renderSms()
// ---------------------------------------------------------------------------

/**
 * Render a branded, localized SMS body for the given template.
 *
 * @returns The SMS body string, or `undefined` if the templateId is unknown.
 */
export function renderSms<T extends SmsTemplateId>(
    templateId: T,
    branding: Partial<TenantBranding> | TenantBranding,
    data: SmsTemplateDataMap[T],
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string
): string | undefined {
    const resolved = resolveBranding(branding);
    const loc = resolveCatalogLocale(locale);

    switch (templateId) {
        case 'inbox-claim': {
            const d = data as SmsInboxClaimData;
            const s = INBOX_CLAIM[loc];
            const greeting = d.recipient?.name ? s.greetingName(d.recipient.name) : '';
            const credType = d.credential?.type ?? 'credential';
            const credName = d.credential?.name ?? 'Unnamed Credential';

            return `${greeting}${s.body(credType, credName, d.issuer?.name)} ${s.cta} ${
                d.claimUrl
            }`;
        }

        case 'contact-method-verification': {
            const d = data as SmsVerificationData;

            return `${VERIFICATION[loc](resolved.brandName)} ${d.verificationToken}`;
        }

        default:
            return undefined;
    }
}
