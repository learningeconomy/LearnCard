/**
 * EmailVerification — link-based email verification (click a button to verify).
 *
 * Used by: brain-service contact-methods.ts (templateId: 'contact-method-verification')
 *
 * This is distinct from VerificationCode (which displays a 6-digit code).
 * Here the user receives a UUID token embedded in a CTA link.
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

export interface EmailVerificationProps {
    branding: TenantBranding;
    verificationToken: string;
    recipient?: {
        name?: string;
    };
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

const STRINGS: Record<
    NotificationLocale,
    {
        preview: string;
        heading: string;
        greeting: string;
        greetingName: string;
        paragraph: string;
        passport: string;
        button: string;
        sincerely: string;
        subject: string;
    }
> = {
    en: {
        preview: 'Verify your email address',
        heading: 'Verify Your Email',
        greeting: 'Hello,',
        greetingName: 'Hello {name},',
        paragraph: 'Please click the button below to verify your email address.',
        passport:
            '{brandName} is your private, digital passport for learning and work. It lets you securely collect and share your verified skills and achievements online.',
        button: 'Verify Your Email \u2192',
        sincerely: 'Sincerely,',
        subject: 'Verify Your Email',
    },
    es: {
        preview: 'Verifica tu dirección de correo',
        heading: 'Verifica tu correo',
        greeting: 'Hola,',
        greetingName: 'Hola {name},',
        paragraph: 'Haz clic en el botón siguiente para verificar tu dirección de correo.',
        passport:
            '{brandName} es tu pasaporte digital y privado para el aprendizaje y el trabajo. Te permite recopilar y compartir de forma segura tus habilidades y logros verificados en línea.',
        button: 'Verifica tu correo \u2192',
        sincerely: 'Atentamente,',
        subject: 'Verifica tu correo',
    },
    fr: {
        preview: 'Vérifiez votre adresse e-mail',
        heading: 'Vérifiez votre e-mail',
        greeting: 'Bonjour,',
        greetingName: 'Bonjour {name},',
        paragraph: 'Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse e-mail.',
        passport:
            '{brandName} est votre passeport numérique privé pour l\u2019apprentissage et le travail. Il vous permet de collecter et de partager en toute sécurité vos compétences et réalisations vérifiées en ligne.',
        button: 'Vérifiez votre e-mail \u2192',
        sincerely: 'Cordialement,',
        subject: 'Vérifiez votre e-mail',
    },
    ar: {
        preview: 'تأكيد عنوان بريدك الإلكتروني',
        heading: 'تأكيد بريدك الإلكتروني',
        greeting: 'مرحبًا،',
        greetingName: 'مرحبًا {name}،',
        paragraph: 'يرجى النقر على الزر أدناه لتأكيد عنوان بريدك الإلكتروني.',
        passport:
            '{brandName} هو جواز سفرك الرقمي والخاص للتعلّم والعمل. يتيح لك جمع ومشاركة مهاراتك وإنجازاتك الموثّقة بأمان عبر الإنترنت.',
        button: 'تأكيد بريدك الإلكتروني ←',
        sincerely: 'مع التحيات،',
        subject: 'تأكيد بريدك الإلكتروني',
    },
};

export const EmailVerification: React.FC<EmailVerificationProps> = ({
    branding,
    verificationToken,
    recipient,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const greeting = interpolate(recipient?.name ? s.greetingName : s.greeting, {
        name: recipient?.name,
    });
    const verifyUrl = `${branding.appUrl}/verify-email?token=${verificationToken}`;
    const passport = interpolate(s.passport, { brandName: branding.brandName });

    return (
        <Layout branding={branding} locale={locale} preview={s.preview}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{greeting}</Text>

            <Text style={paragraph}>{s.paragraph}</Text>

            <Text style={paragraph}>{passport}</Text>

            <Section style={buttonWrapper}>
                <EmailButton href={verifyUrl} branding={branding}>
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

            <LinkFallback href={verifyUrl} locale={locale} />
        </Layout>
    );
};

export const getEmailVerificationSubject = (_branding: TenantBranding, locale?: string): string =>
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
        <EmailVerification
            branding={DEFAULT_BRANDING}
            verificationToken="f47ac10b-58cc-4372-a567-0e02b2c3d479"
            recipient={{ name: 'Jane Doe' }}
        />
    );
}
