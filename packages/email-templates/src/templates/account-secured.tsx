/**
 * AccountSecured — tells the account owner that "Secure my account" ran: every other
 * device and login was signed out and the recovery methods have to be set up again.
 *
 * The recipient may be an owner who did NOT do this (someone with their login and
 * PIN ran it first) and whose own login was unlinked. So the copy never relies on the
 * in-app "Secure my account" link. It also does not offer the app's lost-login path
 * as the way back: the revoke itself returned every recovery method to pending and
 * removed automatic recovery, so that path usually has nothing left to use. It sends
 * the owner to the tenant's support address, or, when the tenant has none, to the
 * organization that gave them access (no address is made up).
 *
 * Used by: lca-api `POST /keys/revoke-other-devices` (templateId: 'account-secured')
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

export interface AccountSecuredProps {
    branding: TenantBranding;
    /** ISO timestamp of the revoke (formatted per locale), or display text. */
    securedAt: string;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string | undefined;
}

type Strings = {
    preview: string;
    heading: string;
    body: (securedAt: string, brandName: string) => React.ReactNode;
    ifYou: string;
    notYouWarning: string;
    resetWarning: string;
    support: string;
    supportFallback: string;
    button: string;
    sincerely: string;
    subject: string;
};

const EN: Strings = {
    preview: 'Other devices were signed out of your account',
    heading: 'Your Account Was Secured',
    body: (securedAt, brandName) => (
        <>
            On <strong>{securedAt}</strong>, someone signed in to your {brandName} account signed
            out every other device and login. The account’s recovery methods now need to be set up
            again.
        </>
    ),
    ifYou: 'If this was you, there is nothing else to do here. Finish setting up your recovery methods in the app.',
    notYouWarning:
        'If this wasn’t you, someone else may have access to your account, and your own sign-in may have been removed.',
    resetWarning:
        'Securing the account also reset its recovery methods, so your recovery phrase, backup, passkey or recovery PIN may no longer get you back in.',
    support: 'Contact {supportEmail} right away for help getting back into your account.',
    supportFallback:
        'Contact the organization that gave you access to {brandName} right away for help getting back into your account.',
    button: 'Open {brandName}',
    sincerely: 'Sincerely,',
    subject: 'Other devices were signed out of your account',
};

const ES: Strings = {
    preview: 'Se cerró la sesión de otros dispositivos en tu cuenta',
    heading: 'Tu Cuenta Fue Protegida',
    body: (securedAt, brandName) => (
        <>
            El <strong>{securedAt}</strong>, alguien con sesión iniciada en tu cuenta de {brandName}{' '}
            cerró la sesión de todos los demás dispositivos e inicios de sesión. Ahora hay que
            volver a configurar los métodos de recuperación de la cuenta.
        </>
    ),
    ifYou: 'Si fuiste tú, no tienes que hacer nada más aquí. Termina de configurar tus métodos de recuperación en la aplicación.',
    notYouWarning:
        'Si no fuiste tú, es posible que otra persona tenga acceso a tu cuenta y que se haya eliminado tu propio inicio de sesión.',
    resetWarning:
        'Al proteger la cuenta también se restablecieron sus métodos de recuperación, así que es posible que tu frase de recuperación, copia de seguridad, llave de acceso o PIN de recuperación ya no te permitan volver a entrar.',
    support:
        'Escribe cuanto antes a {supportEmail} para que te ayuden a recuperar el acceso a tu cuenta.',
    supportFallback:
        'Comunícate cuanto antes con la organización que te dio acceso a {brandName} para que te ayuden a recuperar el acceso a tu cuenta.',
    button: 'Abrir {brandName}',
    sincerely: 'Atentamente,',
    subject: 'Se cerró la sesión de otros dispositivos en tu cuenta',
};

const FR: Strings = {
    preview: 'Les autres appareils ont été déconnectés de votre compte',
    heading: 'Votre Compte a Été Sécurisé',
    body: (securedAt, brandName) => (
        <>
            Le <strong>{securedAt}</strong>, une personne connectée à votre compte {brandName} a
            déconnecté tous les autres appareils et connexions. Les méthodes de récupération du
            compte doivent maintenant être configurées à nouveau.
        </>
    ),
    ifYou: 'Si c’était vous, vous n’avez rien d’autre à faire ici. Terminez la configuration de vos méthodes de récupération dans l’application.',
    notYouWarning:
        'Si ce n’était pas vous, quelqu’un d’autre a peut-être accès à votre compte, et votre propre connexion a peut-être été supprimée.',
    resetWarning:
        'La sécurisation du compte a aussi réinitialisé ses méthodes de récupération : votre phrase de récupération, votre sauvegarde, votre clé d’accès ou votre code PIN de récupération ne vous permettront peut-être plus de vous reconnecter.',
    support:
        'Écrivez sans attendre à {supportEmail} pour obtenir de l’aide afin de récupérer l’accès à votre compte.',
    supportFallback:
        'Contactez sans attendre l’organisation qui vous a donné accès à {brandName} pour obtenir de l’aide afin de récupérer l’accès à votre compte.',
    button: 'Ouvrir {brandName}',
    sincerely: 'Cordialement,',
    subject: 'Les autres appareils ont été déconnectés de votre compte',
};

const AR: Strings = {
    preview: 'تم تسجيل خروج الأجهزة الأخرى من حسابك',
    heading: 'تم تأمين حسابك',
    body: (securedAt, brandName) => (
        <>
            في <strong>{securedAt}</strong>، قام شخص مسجّل الدخول إلى حسابك في {brandName} بتسجيل
            خروج جميع الأجهزة وعمليات تسجيل الدخول الأخرى. يجب الآن إعداد طرق استعادة الحساب من
            جديد.
        </>
    ),
    ifYou: 'إذا كنت أنت، فلا داعي لفعل أي شيء آخر هنا. أكمل إعداد طرق الاستعادة في التطبيق.',
    notYouWarning:
        'إذا لم تكن أنت، فقد يكون لدى شخص آخر حق الوصول إلى حسابك، وربما تمت إزالة تسجيل الدخول الخاص بك.',
    resetWarning:
        'أدى تأمين الحساب أيضًا إلى إعادة تعيين طرق استعادته، لذلك قد لا تتمكن بعد الآن من العودة إلى حسابك باستخدام عبارة الاستعادة أو النسخة الاحتياطية أو مفتاح المرور أو رمز PIN للاستعادة.',
    support: 'راسل {supportEmail} فورًا للحصول على مساعدة في استعادة الوصول إلى حسابك.',
    supportFallback:
        'تواصل فورًا مع الجهة التي منحتك الوصول إلى {brandName} للحصول على مساعدة في استعادة الوصول إلى حسابك.',
    button: 'فتح {brandName}',
    sincerely: 'مع التحيات،',
    subject: 'تم تسجيل خروج الأجهزة الأخرى من حسابك',
};

const STRINGS: Record<NotificationLocale, Strings> = { en: EN, es: ES, fr: FR, ar: AR };

export const AccountSecured: React.FC<AccountSecuredProps> = ({ branding, securedAt, locale }) => {
    const catalogLocale = resolveCatalogLocale(locale);
    const s = STRINGS[catalogLocale];
    const { brandName, supportEmail, appUrl } = branding;

    return (
        <Layout branding={branding} preview={s.preview} {...localeProp(locale)}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>
                {s.body(formatNoticeTimestamp(securedAt, catalogLocale), brandName)}
            </Text>

            <Text style={paragraph}>{s.ifYou}</Text>

            <Text style={warning}>{s.notYouWarning}</Text>

            <Text style={paragraph}>{s.resetWarning}</Text>

            <Text style={paragraph}>
                {supportEmail
                    ? interpolate(s.support, { supportEmail })
                    : interpolate(s.supportFallback, { brandName })}
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={appUrl} branding={branding}>
                    {interpolate(s.button, { brandName })}
                </EmailButton>
            </Section>

            <Text style={signOff}>
                {s.sincerely}
                <br />
                {interpolate(SHARED[catalogLocale].teamSignature, { brandName })}
            </Text>

            <LinkFallback href={appUrl} {...localeProp(locale)} />
        </Layout>
    );
};

export const getAccountSecuredSubject = (_branding: TenantBranding, locale?: string): string =>
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
    return <AccountSecured branding={DEFAULT_BRANDING} securedAt="October 2, 2026, 3:00 PM" />;
}
