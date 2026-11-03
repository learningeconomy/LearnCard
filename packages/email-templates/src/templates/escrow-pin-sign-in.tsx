/**
 * EscrowPinSignIn — tells the account owner that a new device just signed in
 * with their recovery PIN, and links to the in-app "Secure my account" action
 * (which stops other devices and logins from signing in again and turns off the old
 * recovery methods).
 *
 * Used by: lca-api `/keys/escrow/complete` for PIN releases
 * (templateId: 'escrow-pin-sign-in')
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';
import { LinkFallback } from '../components/LinkFallback';
import type { NotificationLocale } from '../i18n';
import {
    resolveCatalogLocale,
    interpolate,
    SHARED,
    formatNoticeTimestamp,
    localeProp,
} from '../i18n';

export interface EscrowPinSignInProps {
    branding: TenantBranding;
    /** ISO timestamp of the PIN sign-in (formatted per locale), or display text. */
    signedInAt: string;
    /** In-app link to the "Secure my account" action. */
    secureUrl: string;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

type Strings = {
    preview: string;
    heading: string;
    body: (signedInAt: string) => React.ReactNode;
    warning: string;
    button: string;
    sincerely: string;
    subject: string;
};

const EN: Strings = {
    preview: 'New device signed in with your PIN',
    heading: 'New Device Signed In With Your PIN',
    body: signedInAt => (
        <>
            A new device signed in to your account with your recovery PIN on{' '}
            <strong>{signedInAt}</strong>.
        </>
    ),
    warning: 'Not you? Secure your account.',
    button: 'Secure my account',
    sincerely: 'Sincerely,',
    subject: 'New device signed in with your PIN',
};

const ES: Strings = {
    preview: 'Un dispositivo nuevo inició sesión con tu PIN',
    heading: 'Un Dispositivo Nuevo Inició Sesión con tu PIN',
    body: signedInAt => (
        <>
            Un dispositivo nuevo inició sesión en tu cuenta con tu PIN de recuperación el{' '}
            <strong>{signedInAt}</strong>.
        </>
    ),
    warning: '¿No fuiste tú? Protege tu cuenta.',
    button: 'Proteger mi cuenta',
    sincerely: 'Atentamente,',
    subject: 'Un dispositivo nuevo inició sesión con tu PIN',
};

const FR: Strings = {
    preview: 'Un nouvel appareil s’est connecté avec votre code PIN',
    heading: 'Un Nouvel Appareil S’est Connecté avec Votre Code PIN',
    body: signedInAt => (
        <>
            Un nouvel appareil s’est connecté à votre compte avec votre code PIN de récupération le{' '}
            <strong>{signedInAt}</strong>.
        </>
    ),
    warning: 'Ce n’était pas vous ? Sécurisez votre compte.',
    button: 'Sécuriser mon compte',
    sincerely: 'Cordialement,',
    subject: 'Un nouvel appareil s’est connecté avec votre code PIN',
};

const AR: Strings = {
    preview: 'تم تسجيل الدخول من جهاز جديد باستخدام رمز PIN الخاص بك',
    heading: 'تم تسجيل الدخول من جهاز جديد باستخدام رمز PIN الخاص بك',
    body: signedInAt => (
        <>
            سجّل جهاز جديد الدخول إلى حسابك باستخدام رمز PIN الخاص بالاستعادة في{' '}
            <strong>{signedInAt}</strong>.
        </>
    ),
    warning: 'لم يكن أنت؟ أمّن حسابك.',
    button: 'تأمين حسابي',
    sincerely: 'مع التحيات،',
    subject: 'تم تسجيل الدخول من جهاز جديد باستخدام رمز PIN الخاص بك',
};

const STRINGS: Record<NotificationLocale, Strings> = { en: EN, es: ES, fr: FR, ar: AR };

export const EscrowPinSignIn: React.FC<EscrowPinSignInProps> = ({
    branding,
    signedInAt,
    secureUrl,
    locale,
}) => {
    const catalogLocale = resolveCatalogLocale(locale);
    const s = STRINGS[catalogLocale];

    return (
        <Layout branding={branding} preview={s.preview} {...localeProp(locale)}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>
                {s.body(formatNoticeTimestamp(signedInAt, catalogLocale))}
            </Text>

            <Text style={warning}>{s.warning}</Text>

            <Section style={buttonWrapper}>
                <EmailButton href={secureUrl} branding={branding}>
                    {s.button}
                </EmailButton>
            </Section>

            <Text style={signOff}>
                {s.sincerely}
                <br />
                {interpolate(SHARED[catalogLocale].teamSignature, {
                    brandName: branding.brandName,
                })}
            </Text>

            <LinkFallback href={secureUrl} {...localeProp(locale)} />
        </Layout>
    );
};

export const getEscrowPinSignInSubject = (_branding: TenantBranding, locale?: string): string =>
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
        <EscrowPinSignIn
            branding={DEFAULT_BRANDING}
            signedInAt="October 2, 2026, 3:00 PM"
            secureUrl="https://learncard.app/account/secure"
        />
    );
}
