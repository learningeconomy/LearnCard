/**
 * EscrowHoldReleased — confirms that a previously requested account recovery
 * has completed and access has been restored.
 *
 * Used by: lca-api recovery hold routes (templateId: 'escrow-hold-released')
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';
import { LinkFallback } from '../components/LinkFallback';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale, interpolate, SHARED } from '../i18n';

export interface EscrowHoldReleasedProps {
    branding: TenantBranding;
    /** Human-readable timestamp access was restored. */
    completedAt: string;
    /** Optional support link shown as a CTA (falls back to the footer's mailto link). */
    supportUrl?: string;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

type Strings = {
    preview: string;
    heading: string;
    body: (completedAt: string) => React.ReactNode;
    warning: string;
    button: string;
    sincerely: string;
    subject: string;
};

const EN: Strings = {
    preview: 'Your account was recovered',
    heading: 'Your Account Was Recovered',
    body: completedAt => (
        <>
            Access to your account was restored on <strong>{completedAt}</strong>.
        </>
    ),
    warning: "If this wasn't you, contact support immediately.",
    button: 'Contact Support',
    sincerely: 'Sincerely,',
    subject: 'Your account was recovered',
};

const ES: Strings = {
    preview: 'Tu cuenta fue recuperada',
    heading: 'Tu Cuenta Fue Recuperada',
    body: completedAt => (
        <>
            Se restableció el acceso a tu cuenta el <strong>{completedAt}</strong>.
        </>
    ),
    warning: 'Si no fuiste tú, comunícate con soporte de inmediato.',
    button: 'Contactar con soporte',
    sincerely: 'Atentamente,',
    subject: 'Tu cuenta fue recuperada',
};

const FR: Strings = {
    preview: 'Votre compte a été récupéré',
    heading: 'Votre Compte a Été Récupéré',
    body: completedAt => (
        <>
            L\u2019accès à votre compte a été rétabli le <strong>{completedAt}</strong>.
        </>
    ),
    warning:
        'Si vous n\u2019êtes pas à l\u2019origine de cette action, contactez immédiatement l\u2019assistance.',
    button: 'Contacter le support',
    sincerely: 'Cordialement,',
    subject: 'Votre compte a été récupéré',
};

const AR: Strings = {
    preview: 'تمت استعادة حسابك',
    heading: 'تمت استعادة حسابك',
    body: completedAt => (
        <>
            تمت استعادة الوصول إلى حسابك في <strong>{completedAt}</strong>.
        </>
    ),
    warning: 'إذا لم يكن هذا أنت، فتواصل مع الدعم فورًا.',
    button: 'تواصل مع الدعم',
    sincerely: 'مع التحيات،',
    subject: 'تمت استعادة حسابك',
};

const STRINGS: Record<NotificationLocale, Strings> = { en: EN, es: ES, fr: FR, ar: AR };

export const EscrowHoldReleased: React.FC<EscrowHoldReleasedProps> = ({
    branding,
    completedAt,
    supportUrl,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];

    return (
        <Layout branding={branding} locale={locale} preview={s.preview}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.body(completedAt)}</Text>

            <Text style={warning}>{s.warning}</Text>

            {supportUrl && (
                <Section style={buttonWrapper}>
                    <EmailButton href={supportUrl} branding={branding}>
                        {s.button}
                    </EmailButton>
                </Section>
            )}

            <Text style={signOff}>
                {s.sincerely}
                <br />
                {interpolate(SHARED[resolveCatalogLocale(locale)].teamSignature, {
                    brandName: branding.brandName,
                })}
            </Text>

            {supportUrl && <LinkFallback href={supportUrl} locale={locale} />}
        </Layout>
    );
};

export const getEscrowHoldReleasedSubject = (_branding: TenantBranding, locale?: string): string =>
    STRINGS[resolveCatalogLocale(locale)].subject;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const heading: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 24px',
};

const paragraph: React.CSSProperties = {
    fontSize: 16,
    color: '#374151',
    lineHeight: '24px',
    margin: '0 0 24px',
};

const warning: React.CSSProperties = {
    ...paragraph,
    fontWeight: 600,
};

const buttonWrapper: React.CSSProperties = {
    margin: '0 0 24px',
};

const signOff: React.CSSProperties = {
    fontSize: 14,
    color: '#374151',
    lineHeight: '20px',
    margin: '24px 0 0',
};

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export default function Preview() {
    return (
        <EscrowHoldReleased
            branding={DEFAULT_BRANDING}
            completedAt="October 2, 2026, 3:00 PM"
            supportUrl="https://learncard.app/support"
        />
    );
}
