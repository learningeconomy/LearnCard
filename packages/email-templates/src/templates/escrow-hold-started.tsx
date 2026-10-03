/**
 * EscrowHoldStarted — notifies a user that an account recovery request was
 * started and gives them a way to cancel it if it wasn't them.
 *
 * Used by: lca-api recovery hold routes (templateId: 'escrow-hold-started')
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

export interface EscrowHoldStartedProps {
    branding: TenantBranding;
    /** Human-readable timestamp the recovery request was made. */
    requestedAt: string;
    /** Human-readable timestamp access will be restored, unless cancelled. */
    releaseAfter: string;
    /** Link that cancels the pending recovery request. */
    cancelUrl: string;
    /** Optional human-readable hint about where the request came from (e.g. browser/OS). */
    deviceHint?: string;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

type Strings = {
    preview: string;
    heading: string;
    body: (requestedAt: string, releaseAfter: string) => React.ReactNode;
    deviceHint: (hint: string) => React.ReactNode;
    warning: string;
    button: string;
    sincerely: string;
    subject: string;
};

const EN: Strings = {
    preview: 'Account recovery started',
    heading: 'Account Recovery Started',
    body: (requestedAt, releaseAfter) => (
        <>
            Someone started recovering your account on <strong>{requestedAt}</strong>. Access will
            be restored on <strong>{releaseAfter}</strong> unless you cancel.
        </>
    ),
    deviceHint: hint => (
        <>
            The request came from <strong>{hint}</strong>.
        </>
    ),
    warning: "If this wasn't you, cancel now.",
    button: "This wasn't me \u2014 Cancel recovery",
    sincerely: 'Sincerely,',
    subject: 'Account recovery started',
};

const ES: Strings = {
    preview: 'Se inició la recuperación de tu cuenta',
    heading: 'Recuperación de Cuenta Iniciada',
    body: (requestedAt, releaseAfter) => (
        <>
            Alguien inició la recuperación de tu cuenta el <strong>{requestedAt}</strong>. El acceso
            se restablecerá el <strong>{releaseAfter}</strong> a menos que la canceles.
        </>
    ),
    deviceHint: hint => (
        <>
            La solicitud provino de <strong>{hint}</strong>.
        </>
    ),
    warning: 'Si no fuiste tú, cancélalo ahora.',
    button: 'No fui yo \u2014 Cancelar recuperación',
    sincerely: 'Atentamente,',
    subject: 'Se inició la recuperación de tu cuenta',
};

const FR: Strings = {
    preview: 'La récupération de votre compte a commencé',
    heading: 'Récupération de Compte Commencée',
    body: (requestedAt, releaseAfter) => (
        <>
            Quelqu\u2019un a commencé à récupérer votre compte le <strong>{requestedAt}</strong>.
            L\u2019accès sera rétabli le <strong>{releaseAfter}</strong> sauf si vous annulez.
        </>
    ),
    deviceHint: hint => (
        <>
            La demande provient de <strong>{hint}</strong>.
        </>
    ),
    warning: 'Si ce n\u2019était pas vous, annulez dès maintenant.',
    button: 'Ce n\u2019était pas moi \u2014 Annuler la récupération',
    sincerely: 'Cordialement,',
    subject: 'La récupération de votre compte a commencé',
};

const AR: Strings = {
    preview: 'بدأت عملية استعادة حسابك',
    heading: 'بدأت استعادة الحساب',
    body: (requestedAt, releaseAfter) => (
        <>
            بدأ شخص ما باستعادة حسابك في <strong>{requestedAt}</strong>. ستتم استعادة الوصول في{' '}
            <strong>{releaseAfter}</strong> ما لم تقم بالإلغاء.
        </>
    ),
    deviceHint: hint => (
        <>
            جاء الطلب من <strong>{hint}</strong>.
        </>
    ),
    warning: 'إذا لم يكن هذا أنت، ألغِ الطلب الآن.',
    button: 'لم يكن أنا \u2014 إلغاء الاستعادة',
    sincerely: 'مع التحيات،',
    subject: 'بدأت عملية استعادة حسابك',
};

const STRINGS: Record<NotificationLocale, Strings> = { en: EN, es: ES, fr: FR, ar: AR };

export const EscrowHoldStarted: React.FC<EscrowHoldStartedProps> = ({
    branding,
    requestedAt,
    releaseAfter,
    cancelUrl,
    deviceHint,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];

    return (
        <Layout branding={branding} locale={locale} preview={s.preview}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.body(requestedAt, releaseAfter)}</Text>

            {deviceHint && <Text style={paragraph}>{s.deviceHint(deviceHint)}</Text>}

            <Text style={warning}>{s.warning}</Text>

            <Section style={buttonWrapper}>
                <EmailButton href={cancelUrl} branding={branding}>
                    {s.button}
                </EmailButton>
            </Section>

            <Text style={signOff}>
                {s.sincerely}
                <br />
                {interpolate(SHARED[resolveCatalogLocale(locale)].teamSignature, {
                    brandName: branding.brandName,
                })}
            </Text>

            <LinkFallback href={cancelUrl} locale={locale} />
        </Layout>
    );
};

export const getEscrowHoldStartedSubject = (_branding: TenantBranding, locale?: string): string =>
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
        <EscrowHoldStarted
            branding={DEFAULT_BRANDING}
            requestedAt="September 25, 2026, 3:00 PM"
            releaseAfter="October 2, 2026, 3:00 PM"
            cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
            deviceHint="Chrome on Windows"
        />
    );
}
