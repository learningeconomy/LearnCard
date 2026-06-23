/**
 * VerificationCode — shared template for all code-based verification emails.
 *
 * Used by:
 *   - login-verification-code (lca-api firebase.ts)
 *   - recovery-email-code (lca-api keys.ts)
 *   - embed-email-verification (brain-service contact-methods.ts)
 *   - contact-method-verification (brain-service contact-methods.ts)
 *
 * The `variant` prop controls the subject line and descriptive text.
 */

import { Text } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { CodeBlock } from '../components/CodeBlock';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale, interpolate } from '../i18n';

export type VerificationCodeVariant =
    | 'login'
    | 'recovery-email'
    | 'embed-verification'
    | 'contact-method';

export interface VerificationCodeProps {
    branding: TenantBranding;
    verificationCode: string;
    verificationEmail?: string;
    variant: VerificationCodeVariant;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

/**
 * Per-variant, per-locale strings. `description` is a function because the
 * login/recovery-email/embed-verification variants historically branched on
 * whether a verification email address was present (two distinct EN strings).
 * EN values byte-match the original templates.
 */
type VariantStrings = {
    subject: string;
    heading: string;
    description: (email: string | undefined, brandName: string) => string;
    expiry: string;
};

const EN: Record<VerificationCodeVariant, VariantStrings> = {
    login: {
        subject: 'Your {brandName} login code',
        heading: 'Your {brandName} Login Code',
        description: (_email, b) => `Here's your secure 6-digit code to log into ${b}`,
        expiry: 'This code will expire in 5 minutes. If you didn\u2019t request this, you can safely ignore this email.',
    },
    'recovery-email': {
        subject: 'Verify your recovery email',
        heading: 'Your {brandName} Verification Code',
        description: (email, b) =>
            email
                ? `Here's your secure 6-digit code to add ${email} as a recovery method for ${b}`
                : `Here's your secure 6-digit code to add a recovery method for ${b}`,
        expiry: 'This code will expire in 5 minutes. If you didn\u2019t request this, you can safely ignore this email.',
    },
    'embed-verification': {
        subject: 'Your {brandName} verification code',
        heading: 'Your {brandName} Verification Code',
        description: email =>
            email
                ? `Enter this code to verify ${email} and claim your credential:`
                : 'Enter this code to verify your email address and claim your credential:',
        expiry: 'This code will expire in 10 minutes. If you didn\u2019t request this, you can safely ignore this email.',
    },
    'contact-method': {
        subject: 'Your {brandName} verification code',
        heading: 'Your {brandName} Verification Code',
        description: () => 'Enter this code in the app to verify your contact information.',
        expiry: 'This code will expire in 24 hours. If you didn\u2019t request this, you can safely ignore this email.',
    },
};

const ES: Record<VerificationCodeVariant, VariantStrings> = {
    login: {
        subject: 'Tu código de acceso a {brandName}',
        heading: 'Tu código de acceso a {brandName}',
        description: (_email, b) =>
            `Aquí tienes tu código seguro de 6 dígitos para iniciar sesión en ${b}`,
        expiry: 'Este código caducará en 5 minutos. Si no solicitaste esto, puedes ignorar este correo con seguridad.',
    },
    'recovery-email': {
        subject: 'Verifica tu correo de recuperación',
        heading: 'Tu código de verificación de {brandName}',
        description: (email, b) =>
            email
                ? `Aquí tienes tu código seguro de 6 dígitos para añadir ${email} como método de recuperación de ${b}`
                : `Aquí tienes tu código seguro de 6 dígitos para añadir un método de recuperación de ${b}`,
        expiry: 'Este código caducará en 5 minutos. Si no solicitaste esto, puedes ignorar este correo con seguridad.',
    },
    'embed-verification': {
        subject: 'Tu código de verificación de {brandName}',
        heading: 'Tu código de verificación de {brandName}',
        description: email =>
            email
                ? `Introduce este código para verificar ${email} y reclamar tu credencial:`
                : 'Introduce este código para verificar tu dirección de correo y reclamar tu credencial:',
        expiry: 'Este código caducará en 10 minutos. Si no solicitaste esto, puedes ignorar este correo con seguridad.',
    },
    'contact-method': {
        subject: 'Tu código de verificación de {brandName}',
        heading: 'Tu código de verificación de {brandName}',
        description: () =>
            'Introduce este código en la app para verificar tu información de contacto.',
        expiry: 'Este código caducará en 24 horas. Si no solicitaste esto, puedes ignorar este correo con seguridad.',
    },
};

const FR: Record<VerificationCodeVariant, VariantStrings> = {
    login: {
        subject: 'Votre code de connexion {brandName}',
        heading: 'Votre code de connexion {brandName}',
        description: (_email, b) =>
            `Voici votre code sécurisé à 6 chiffres pour vous connecter à ${b}`,
        expiry: 'Ce code expirera dans 5 minutes. Si vous n\u2019êtes pas à l\u2019origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.',
    },
    'recovery-email': {
        subject: 'Vérifiez votre e-mail de récupération',
        heading: 'Votre code de vérification {brandName}',
        description: (email, b) =>
            email
                ? `Voici votre code sécurisé à 6 chiffres pour ajouter ${email} comme méthode de récupération à ${b}`
                : `Voici votre code sécurisé à 6 chiffres pour ajouter une méthode de récupération à ${b}`,
        expiry: 'Ce code expirera dans 5 minutes. Si vous n\u2019êtes pas à l\u2019origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.',
    },
    'embed-verification': {
        subject: 'Votre code de vérification {brandName}',
        heading: 'Votre code de vérification {brandName}',
        description: email =>
            email
                ? `Saisissez ce code pour vérifier ${email} et réclamer votre titre :`
                : 'Saisissez ce code pour vérifier votre adresse e-mail et réclamer votre titre :',
        expiry: 'Ce code expirera dans 10 minutes. Si vous n\u2019êtes pas à l\u2019origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.',
    },
    'contact-method': {
        subject: 'Votre code de vérification {brandName}',
        heading: 'Votre code de vérification {brandName}',
        description: () =>
            'Saisissez ce code dans l\u2019application pour vérifier vos coordonnées.',
        expiry: 'Ce code expirera dans 24 heures. Si vous n\u2019êtes pas à l\u2019origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.',
    },
};

const AR: Record<VerificationCodeVariant, VariantStrings> = {
    login: {
        subject: 'رمز تسجيل الدخول إلى {brandName}',
        heading: 'رمز تسجيل الدخول إلى {brandName}',
        description: (_email, b) => `إليك رمزك الآمن المكوّن من 6 أرقام لتسجيل الدخول إلى ${b}`,
        expiry: 'تنتهي صلاحية هذا الرمز خلال 5 دقائق. إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.',
    },
    'recovery-email': {
        subject: 'تأكيد بريد الاستعادة الخاص بك',
        heading: 'رمز التحقق الخاص بك في {brandName}',
        description: (email, b) =>
            email
                ? `إليك رمزك الآمن المكوّن من 6 أرقام لإضافة ${email} كطريقة استعادة في ${b}`
                : `إليك رمزك الآمن المكوّن من 6 أرقام لإضافة طريقة استعادة في ${b}`,
        expiry: 'تنتهي صلاحية هذا الرمز خلال 5 دقائق. إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.',
    },
    'embed-verification': {
        subject: 'رمز التحقق الخاص بك في {brandName}',
        heading: 'رمز التحقق الخاص بك في {brandName}',
        description: email =>
            email
                ? `أدخل هذا الرمز لتأكيد ${email} والمطالبة بشهادتك:`
                : 'أدخل هذا الرمز لتأكيد عنوان بريدك الإلكتروني والمطالبة بشهادتك:',
        expiry: 'تنتهي صلاحية هذا الرمز خلال 10 دقائق. إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.',
    },
    'contact-method': {
        subject: 'رمز التحقق الخاص بك في {brandName}',
        heading: 'رمز التحقق الخاص بك في {brandName}',
        description: () => 'أدخل هذا الرمز في التطبيق لتأكيد معلومات الاتصال الخاصة بك.',
        expiry: 'تنتهي صلاحية هذا الرمز خلال 24 ساعة. إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.',
    },
};

const CATALOGS: Record<NotificationLocale, Record<VerificationCodeVariant, VariantStrings>> = {
    en: EN,
    es: ES,
    fr: FR,
    ar: AR,
};

/** Shared body strings (interpolates {brandName}). */
const BODY: Record<
    NotificationLocale,
    { greeting: string; passport: string; sincerely: string; codeLabel: string }
> = {
    en: {
        greeting: 'Hello,',
        passport:
            '{brandName} is your private, digital passport for learning and work. It lets you securely collect and share your verified skills and achievements online.',
        sincerely: 'Sincerely,',
        codeLabel: 'Verification code',
    },
    es: {
        greeting: 'Hola,',
        passport:
            '{brandName} es tu pasaporte digital y privado para el aprendizaje y el trabajo. Te permite recopilar y compartir de forma segura tus habilidades y logros verificados en línea.',
        sincerely: 'Atentamente,',
        codeLabel: 'Código de verificación',
    },
    fr: {
        greeting: 'Bonjour,',
        passport:
            '{brandName} est votre passeport numérique privé pour l\u2019apprentissage et le travail. Il vous permet de collecter et de partager en toute sécurité vos compétences et réalisations vérifiées en ligne.',
        sincerely: 'Cordialement,',
        codeLabel: 'Code de vérification',
    },
    ar: {
        greeting: 'مرحبًا،',
        passport:
            '{brandName} هو جواز سفرك الرقمي والخاص للتعلّم والعمل. يتيح لك جمع ومشاركة مهاراتك وإنجازاتك الموثّقة بأمان عبر الإنترنت.',
        sincerely: 'مع التحيات،',
        codeLabel: 'رمز التحقق',
    },
};

export const VerificationCode: React.FC<VerificationCodeProps> = ({
    branding,
    verificationCode,
    verificationEmail,
    variant,
    locale,
}) => {
    const loc = resolveCatalogLocale(locale);
    const config = CATALOGS[loc][variant];
    const body = BODY[loc];
    const heading = interpolate(config.heading, { brandName: branding.brandName });
    const description = config.description(verificationEmail, branding.brandName);
    const passport = interpolate(body.passport, { brandName: branding.brandName });

    return (
        <Layout branding={branding} locale={locale} preview={`Your code: ${verificationCode}`}>
            <Text style={headingStyle}>{heading}</Text>

            <Text style={paragraph}>{body.greeting}</Text>

            <Text style={paragraph}>{description}</Text>

            <CodeBlock code={verificationCode} label={body.codeLabel} />

            <Text style={muted}>{config.expiry}</Text>

            <Text style={paragraph}>{passport}</Text>

            <Text style={signOff}>
                {body.sincerely}
                <br />
                The {branding.brandName} Team
            </Text>
        </Layout>
    );
};

export const getVerificationCodeSubject = (
    branding: TenantBranding,
    variant: VerificationCodeVariant,
    locale?: string
): string => {
    const config = CATALOGS[resolveCatalogLocale(locale)][variant];
    return interpolate(config.subject, { brandName: branding.brandName });
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const headingStyle: React.CSSProperties = {
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
// Preview (used by `pnpm dev` / react-email dev server)
// ---------------------------------------------------------------------------

export default function Preview() {
    return (
        <VerificationCode
            branding={DEFAULT_BRANDING}
            verificationCode="847293"
            verificationEmail="jane@example.com"
            variant="login"
        />
    );
}
