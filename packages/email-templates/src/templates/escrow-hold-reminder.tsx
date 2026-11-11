/**
 * EscrowHoldReminder — reminds a user that a pending account recovery request
 * is about to complete, and gives them one more chance to cancel it.
 *
 * Used by: lca-api recovery hold routes (templateId: 'escrow-hold-reminder')
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

export interface EscrowHoldReminderProps {
    branding: TenantBranding;
    /** Human-readable timestamp access will be restored, unless cancelled. */
    releaseAfter: string;
    /** Link that cancels the pending recovery request. */
    cancelUrl: string;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

type Strings = {
    preview: string;
    heading: string;
    body: (releaseAfter: string) => React.ReactNode;
    warning: string;
    button: string;
    sincerely: string;
    subject: string;
};

const EN: Strings = {
    preview: 'Recovery completes tomorrow',
    heading: 'Recovery Completes Tomorrow',
    body: releaseAfter => (
        <>
            Your account recovery will complete on <strong>{releaseAfter}</strong> unless you cancel
            it.
        </>
    ),
    warning: "If this wasn't you, cancel now.",
    button: "This wasn't me \u2014 Cancel recovery",
    sincerely: 'Sincerely,',
    subject: 'Recovery completes tomorrow',
};

const ES: Strings = {
    preview: 'La recuperación se completa mañana',
    heading: 'La Recuperación se Completa Mañana',
    body: releaseAfter => (
        <>
            La recuperación de tu cuenta se completará el <strong>{releaseAfter}</strong> a menos
            que la canceles.
        </>
    ),
    warning: 'Si no fuiste tú, cancélalo ahora.',
    button: 'No fui yo \u2014 Cancelar recuperación',
    sincerely: 'Atentamente,',
    subject: 'La recuperación se completa mañana',
};

const FR: Strings = {
    preview: 'La récupération se termine demain',
    heading: 'La Récupération se Termine Demain',
    body: releaseAfter => (
        <>
            La récupération de votre compte sera terminée le <strong>{releaseAfter}</strong> sauf si
            vous l\u2019annulez.
        </>
    ),
    warning: 'Si ce n\u2019était pas vous, annulez dès maintenant.',
    button: 'Ce n\u2019était pas moi \u2014 Annuler la récupération',
    sincerely: 'Cordialement,',
    subject: 'La récupération se termine demain',
};

const AR: Strings = {
    preview: 'تكتمل الاستعادة غدًا',
    heading: 'تكتمل الاستعادة غدًا',
    body: releaseAfter => (
        <>
            ستكتمل استعادة حسابك في <strong>{releaseAfter}</strong> ما لم تقم بإلغائها.
        </>
    ),
    warning: 'إذا لم يكن هذا أنت، ألغِ الطلب الآن.',
    button: 'لم يكن أنا \u2014 إلغاء الاستعادة',
    sincerely: 'مع التحيات،',
    subject: 'تكتمل الاستعادة غدًا',
};

const STRINGS: Record<NotificationLocale, Strings> = { en: EN, es: ES, fr: FR, ar: AR };

export const EscrowHoldReminder: React.FC<EscrowHoldReminderProps> = ({
    branding,
    releaseAfter,
    cancelUrl,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];

    return (
        <Layout branding={branding} locale={locale} preview={s.preview}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.body(releaseAfter)}</Text>

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

export const getEscrowHoldReminderSubject = (_branding: TenantBranding, locale?: string): string =>
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
        <EscrowHoldReminder
            branding={DEFAULT_BRANDING}
            releaseAfter="October 2, 2026, 3:00 PM"
            cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
        />
    );
}
