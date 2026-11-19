/**
 * EscrowResetStarted — tells a ClassLink student's school address that a PIN reset (the
 * waiting-period recovery) was started on their account (LC-2409).
 *
 * Once a personal email is the account's sign-in email, the reset codes go to that personal
 * inbox. The school address still signs in to the account (within the district's alias
 * limits), so it gets this informational notice too. It deliberately carries no cancel link:
 * a recycled or shared school inbox must not be able to cancel the owner's own reset. It
 * sends the reader to the tenant's support address, or, when the tenant has none, to the
 * organization that gave them access (no address is made up).
 *
 * Used by: lca-api `POST /keys/escrow/recover` (templateId: 'escrow-reset-started')
 */

import { Text } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import type { NotificationLocale } from '../i18n';
import {
    resolveCatalogLocale,
    interpolate,
    SHARED,
    formatNoticeTimestamp,
    localeProp,
} from '../i18n';

export interface EscrowResetStartedProps {
    branding: TenantBranding;
    /** ISO timestamp the reset was started (formatted per locale), or display text. */
    requestedAt: string;
    /** ISO timestamp the reset can finish (formatted per locale), or display text. */
    releaseAfter: string;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string | undefined;
}

type Strings = {
    preview: string;
    heading: string;
    body: (requestedAt: string, releaseAfter: string, brandName: string) => React.ReactNode;
    why: string;
    ifYou: string;
    support: string;
    supportFallback: string;
    sincerely: string;
    subject: string;
};

// es/fr/ar: drafted with the template; have a translator review before launch.
const EN: Strings = {
    preview: 'A PIN reset was started on your account',
    heading: 'A PIN Reset Was Started',
    body: (requestedAt, releaseAfter, brandName) => (
        <>
            On <strong>{requestedAt}</strong>, someone started resetting the PIN on your {brandName}{' '}
            account. Unless it is cancelled, the reset can finish on <strong>{releaseAfter}</strong>
            .
        </>
    ),
    why: 'We sent this to your school email because it can still sign in to this account.',
    ifYou: 'If this was you, there is nothing else to do.',
    support: 'If this wasn’t you, contact {supportEmail} right away.',
    supportFallback:
        'If this wasn’t you, contact the organization that gave you access to {brandName} right away.',
    sincerely: 'Sincerely,',
    subject: 'A PIN reset was started on your account',
};

const ES: Strings = {
    preview: 'Se inició el restablecimiento del PIN de tu cuenta',
    heading: 'Se Inició un Restablecimiento del PIN',
    body: (requestedAt, releaseAfter, brandName) => (
        <>
            El <strong>{requestedAt}</strong>, alguien empezó a restablecer el PIN de tu cuenta de{' '}
            {brandName}. Si no se cancela, el restablecimiento puede completarse el{' '}
            <strong>{releaseAfter}</strong>.
        </>
    ),
    why: 'Te enviamos esto a tu correo escolar porque todavía puede iniciar sesión en esta cuenta.',
    ifYou: 'Si fuiste tú, no tienes que hacer nada más.',
    support: 'Si no fuiste tú, escribe cuanto antes a {supportEmail}.',
    supportFallback:
        'Si no fuiste tú, comunícate cuanto antes con la organización que te dio acceso a {brandName}.',
    sincerely: 'Atentamente,',
    subject: 'Se inició el restablecimiento del PIN de tu cuenta',
};

const FR: Strings = {
    preview: 'Une réinitialisation du code PIN de votre compte a été lancée',
    heading: 'Réinitialisation du Code PIN Lancée',
    body: (requestedAt, releaseAfter, brandName) => (
        <>
            Le <strong>{requestedAt}</strong>, quelqu’un a commencé à réinitialiser le code PIN de
            votre compte {brandName}. Sauf annulation, la réinitialisation peut aboutir le{' '}
            <strong>{releaseAfter}</strong>.
        </>
    ),
    why: 'Nous vous envoyons ce message à votre adresse scolaire, car elle permet toujours de se connecter à ce compte.',
    ifYou: 'Si c’était vous, vous n’avez rien d’autre à faire.',
    support: 'Si ce n’était pas vous, écrivez sans attendre à {supportEmail}.',
    supportFallback:
        'Si ce n’était pas vous, contactez sans attendre l’organisation qui vous a donné accès à {brandName}.',
    sincerely: 'Cordialement,',
    subject: 'Une réinitialisation du code PIN de votre compte a été lancée',
};

const AR: Strings = {
    preview: 'بدأت إعادة تعيين رمز PIN لحسابك',
    heading: 'بدأت إعادة تعيين رمز PIN',
    body: (requestedAt, releaseAfter, brandName) => (
        <>
            في <strong>{requestedAt}</strong>، بدأ شخص ما إعادة تعيين رمز PIN لحسابك في {brandName}.
            ما لم يتم إلغاؤها، يمكن أن تكتمل إعادة التعيين في <strong>{releaseAfter}</strong>.
        </>
    ),
    why: 'أرسلنا هذه الرسالة إلى بريدك المدرسي لأنه لا يزال بإمكانه تسجيل الدخول إلى هذا الحساب.',
    ifYou: 'إذا كنت أنت، فلا داعي لفعل أي شيء آخر.',
    support: 'إذا لم تكن أنت، فراسل {supportEmail} فورًا.',
    supportFallback: 'إذا لم تكن أنت، فتواصل فورًا مع الجهة التي منحتك الوصول إلى {brandName}.',
    sincerely: 'مع التحيات،',
    subject: 'بدأت إعادة تعيين رمز PIN لحسابك',
};

const STRINGS: Record<NotificationLocale, Strings> = { en: EN, es: ES, fr: FR, ar: AR };

export const EscrowResetStarted: React.FC<EscrowResetStartedProps> = ({
    branding,
    requestedAt,
    releaseAfter,
    locale,
}) => {
    const catalogLocale = resolveCatalogLocale(locale);
    const s = STRINGS[catalogLocale];
    const { brandName, supportEmail } = branding;

    return (
        <Layout branding={branding} preview={s.preview} {...localeProp(locale)}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>
                {s.body(
                    formatNoticeTimestamp(requestedAt, catalogLocale),
                    formatNoticeTimestamp(releaseAfter, catalogLocale),
                    brandName
                )}
            </Text>

            <Text style={paragraph}>{s.why}</Text>

            <Text style={paragraph}>{s.ifYou}</Text>

            <Text style={warning}>
                {supportEmail
                    ? interpolate(s.support, { supportEmail })
                    : interpolate(s.supportFallback, { brandName })}
            </Text>

            <Text style={signOff}>
                {s.sincerely}
                <br />
                {interpolate(SHARED[catalogLocale].teamSignature, { brandName })}
            </Text>
        </Layout>
    );
};

export const getEscrowResetStartedSubject = (_branding: TenantBranding, locale?: string): string =>
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
        <EscrowResetStarted
            branding={DEFAULT_BRANDING}
            requestedAt="September 25, 2026, 3:00 PM"
            releaseAfter="October 2, 2026, 3:00 PM"
        />
    );
}
