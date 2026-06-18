/**
 * AccountApproved — email sent when a user's account has been approved.
 *
 * Used by: brain-service inbox.ts (templateId: 'account-approved-email')
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale } from '../i18n';

export interface AccountApprovedProps {
    branding: TenantBranding;
    user?: {
        displayName?: string;
    };
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

const STRINGS: Record<
    NotificationLocale,
    {
        preview: (brandName: string) => string;
        heading: (brandName: string) => string;
        greeting: (name: string) => string;
        body1: (brandName: string) => string;
        body2: string;
        ctaInstruction: string;
        button: (brandName: string) => string;
        thankYou: string;
        subject: (brandName: string) => string;
    }
> = {
    en: {
        preview: b => `Your ${b} account has been approved!`,
        heading: b => `Your ${b} account has been approved!`,
        greeting: name => `Hello ${name},`,
        body1: b => `Your ${b} account has been approved by your guardian/parent.`,
        body2: '{brandName} is a private, digital passport for learning and work. It lets users securely collect and share their verified skills and achievements online.',
        ctaInstruction: 'Please click the button below to login to your account.',
        button: b => `Login to ${b} \u2192`,
        thankYou: 'Thank you,',
        subject: b => `Your ${b} account has been approved`,
    },
    es: {
        preview: b => `¡Tu cuenta de ${b} ha sido aprobada!`,
        heading: b => `¡Tu cuenta de ${b} ha sido aprobada!`,
        greeting: name => `Hola ${name},`,
        body1: b => `Tu cuenta de ${b} ha sido aprobada por tu tutor o progenitor.`,
        body2: '{brandName} es un pasaporte digital y privado para el aprendizaje y el trabajo. Permite a los usuarios recopilar y compartir de forma segura sus habilidades y logros verificados en línea.',
        ctaInstruction: 'Haz clic en el botón siguiente para iniciar sesión en tu cuenta.',
        button: b => `Iniciar sesión en ${b} \u2192`,
        thankYou: 'Gracias,',
        subject: b => `Tu cuenta de ${b} ha sido aprobada`,
    },
    fr: {
        preview: b => `Votre compte ${b} a été approuvé !`,
        heading: b => `Votre compte ${b} a été approuvé !`,
        greeting: name => `Bonjour ${name},`,
        body1: b => `Votre compte ${b} a été approuvé par votre tuteur ou parent.`,
        body2: '{brandName} est un passeport numérique privé pour l\u2019apprentissage et le travail. Il permet aux utilisateurs de collecter et de partager en toute sécurité leurs compétences et réalisations vérifiées en ligne.',
        ctaInstruction:
            'Veuillez cliquer sur le bouton ci-dessous pour vous connecter à votre compte.',
        button: b => `Se connecter à ${b} \u2192`,
        thankYou: 'Merci,',
        subject: b => `Votre compte ${b} a été approuvé`,
    },
    ar: {
        preview: b => `تمت الموافقة على حسابك في ${b}!`,
        heading: b => `تمت الموافقة على حسابك في ${b}!`,
        greeting: name => `مرحبًا ${name}،`,
        body1: b => `تمت الموافقة على حسابك في ${b} من قبل ولي أمرك.`,
        body2: '{brandName} هو جواز سفر رقمي خاص للتعلّم والعمل. يتيح للمستخدمين جمع ومشاركة مهاراتهم وإنجازاتهم الموثّقة بأمان عبر الإنترنت.',
        ctaInstruction: 'يرجى النقر على الزر أدناه لتسجيل الدخول إلى حسابك.',
        button: b => `تسجيل الدخول إلى ${b} ←`,
        thankYou: 'شكرًا،',
        subject: b => `تمت الموافقة على حسابك في ${b}`,
    },
};

const interpolate = (template: string, params: Record<string, string | undefined>): string =>
    template.replace(/\{(\w+)\}/g, (match, key: string) => {
        const value = params[key];
        return value === undefined ? match : value;
    });

export const AccountApproved: React.FC<AccountApprovedProps> = ({ branding, user, locale }) => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const name = user?.displayName ?? 'there';

    return (
        <Layout branding={branding} locale={locale} preview={s.preview(branding.brandName)}>
            <Text style={heading}>{s.heading(branding.brandName)}</Text>

            <Text style={paragraph}>{s.greeting(name)}</Text>

            <Text style={paragraph}>{s.body1(branding.brandName)}</Text>

            <Text style={paragraph}>{interpolate(s.body2, { brandName: branding.brandName })}</Text>

            <Text style={paragraph}>{s.ctaInstruction}</Text>

            <Section style={buttonWrapper}>
                <EmailButton href={branding.appUrl} branding={branding}>
                    {s.button(branding.brandName)}
                </EmailButton>
            </Section>

            <Text style={signOff}>
                {s.thankYou}
                <br />
                The {branding.brandName} Team
            </Text>
        </Layout>
    );
};

export const getAccountApprovedSubject = (branding: TenantBranding, locale?: string): string =>
    STRINGS[resolveCatalogLocale(locale)].subject(branding.brandName);

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
    return <AccountApproved branding={DEFAULT_BRANDING} user={{ displayName: 'Jane Doe' }} />;
}
