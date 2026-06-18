/**
 * GuardianEmailOtp — verification code email sent to a guardian when they
 * open an approval link and need to confirm their identity via OTP.
 *
 * Used by: brain-service (templateAlias: 'guardian-email-otp')
 */

import { Text } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { CodeBlock } from '../components/CodeBlock';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale } from '../i18n';

export interface GuardianEmailOtpProps {
    branding: TenantBranding;
    verificationCode: string;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

const STRINGS: Record<
    NotificationLocale,
    {
        preview: (code: string) => string;
        heading: string;
        greeting: string;
        body: string;
        codeLabel: string;
        expiry: () => React.ReactNode;
        notRequested: string;
        sincerely: string;
        subject: string;
    }
> = {
    en: {
        preview: c => `Your verification code: ${c}`,
        heading: 'Your verification code',
        greeting: 'Hi there,',
        body: 'Here is your verification code to confirm your identity as guardian and complete your review:',
        codeLabel: 'Verification code',
        expiry: () => (
            <>
                This code expires in <strong style={{ color: '#374151' }}>1 hour</strong>. Do not
                share it with anyone.
            </>
        ),
        notRequested: 'If you did not request this code, you can safely ignore this email.',
        sincerely: 'Sincerely,',
        subject: 'Your Verification Code',
    },
    es: {
        preview: c => `Tu código de verificación: ${c}`,
        heading: 'Tu código de verificación',
        greeting: 'Hola,',
        body: 'Aquí tienes tu código de verificación para confirmar tu identidad como tutor y completar tu revisión:',
        codeLabel: 'Código de verificación',
        expiry: () => (
            <>
                Este código caduca en <strong style={{ color: '#374151' }}>1 hora</strong>. No lo
                compartas con nadie.
            </>
        ),
        notRequested: 'Si no solicitaste este código, puedes ignorar este correo con seguridad.',
        sincerely: 'Atentamente,',
        subject: 'Tu código de verificación',
    },
    fr: {
        preview: c => `Votre code de vérification : ${c}`,
        heading: 'Votre code de vérification',
        greeting: 'Bonjour,',
        body: 'Voici votre code de vérification pour confirmer votre identité en tant que tuteur et terminer votre révision :',
        codeLabel: 'Code de vérification',
        expiry: () => (
            <>
                Ce code expire dans <strong style={{ color: '#374151' }}>1 heure</strong>. Ne le
                partagez avec personne.
            </>
        ),
        notRequested:
            'Si vous n\u2019êtes pas à l\u2019origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.',
        sincerely: 'Cordialement,',
        subject: 'Votre code de vérification',
    },
    ar: {
        preview: c => `رمز التحقق الخاص بك: ${c}`,
        heading: 'رمز التحقق الخاص بك',
        greeting: 'مرحبًا،',
        body: 'إليك رمز التحقق لتأكيد هويتك كولي أمر وإكمال مراجعتك:',
        codeLabel: 'رمز التحقق',
        expiry: () => (
            <>
                تنتهي صلاحية هذا الرمز خلال <strong style={{ color: '#374151' }}>ساعة واحدة</strong>
                . لا تشاركه مع أي شخص.
            </>
        ),
        notRequested: 'إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.',
        sincerely: 'مع التحيات،',
        subject: 'رمز التحقق الخاص بك',
    },
};

export const GuardianEmailOtp: React.FC<GuardianEmailOtpProps> = ({
    branding,
    verificationCode,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];

    return (
        <Layout branding={branding} locale={locale} preview={s.preview(verificationCode)}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.greeting}</Text>

            <Text style={paragraph}>{s.body}</Text>

            <CodeBlock code={verificationCode} label={s.codeLabel} />

            <Text style={muted}>{s.expiry()}</Text>

            <Text style={muted}>{s.notRequested}</Text>

            <Text style={signOff}>
                {s.sincerely}
                <br />
                The {branding.brandName} Team
            </Text>
        </Layout>
    );
};

export const getGuardianEmailOtpSubject = (_branding: TenantBranding, locale?: string): string =>
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

const muted: React.CSSProperties = {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: '20px',
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
    return <GuardianEmailOtp branding={DEFAULT_BRANDING} verificationCode="847293" />;
}
