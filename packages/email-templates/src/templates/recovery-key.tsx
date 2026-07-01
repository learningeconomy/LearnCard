/**
 * RecoveryKey — email containing a user's account recovery key.
 *
 * Used by: lca-api keys.ts (templateAlias: RECOVERY_KEY_TEMPLATE_ALIAS)
 */

import { Text } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { CodeBlock } from '../components/CodeBlock';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale, interpolate, SHARED } from '../i18n';

export interface RecoveryKeyProps {
    branding: TenantBranding;
    recoveryKey: string;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

const STRINGS: Record<
    NotificationLocale,
    {
        preview: (brandName: string) => string;
        heading: (brandName: string) => string;
        greeting: string;
        body: (brandName: string) => string;
        codeLabel: string;
        recoverInstruction: () => React.ReactNode;
        notRequested: string;
        passport: string;
        sincerely: string;
        subject: (brandName: string) => string;
    }
> = {
    en: {
        preview: b => `Your ${b} recovery key \u2014 keep this safe`,
        heading: b => `Your ${b} Recovery Key`,
        greeting: 'Hello,',
        body: b =>
            `Keep this email safe. You can use the recovery key below to regain access to your ${b} account if you lose your device.`,
        codeLabel: 'Recovery Key \u2014 do NOT share this with anyone',
        recoverInstruction: () => (
            <>
                To recover your account, choose <strong>&ldquo;Recover via Email&rdquo;</strong> in
                the app and paste the recovery key above when prompted.
            </>
        ),
        notRequested: 'If you did not request this, you can safely ignore this email.',
        passport:
            '{brandName} is your private, digital passport for learning and work. It lets you securely collect and share your verified skills and achievements online.',
        sincerely: 'Sincerely,',
        subject: b => `Your ${b} recovery key`,
    },
    es: {
        preview: b => `Tu clave de recuperación de ${b} \u2014 guárdala en un lugar seguro`,
        heading: b => `Tu clave de recuperación de ${b}`,
        greeting: 'Hola,',
        body: b =>
            `Guarda este correo en un lugar seguro. Puedes usar la clave de recuperación siguiente para recuperar el acceso a tu cuenta de ${b} si pierdes tu dispositivo.`,
        codeLabel: 'Clave de recuperación \u2014 NO la compartas con nadie',
        recoverInstruction: () => (
            <>
                Para recuperar tu cuenta, elige <strong>&ldquo;Recuperar por correo&rdquo;</strong>{' '}
                en la app y pega la clave de recuperación anterior cuando se te solicite.
            </>
        ),
        notRequested: 'Si no solicitaste esto, puedes ignorar este correo con seguridad.',
        passport:
            '{brandName} es tu pasaporte digital y privado para el aprendizaje y el trabajo. Te permite recopilar y compartir de forma segura tus habilidades y logros verificados en línea.',
        sincerely: 'Atentamente,',
        subject: b => `Tu clave de recuperación de ${b}`,
    },
    fr: {
        preview: b => `Votre clé de récupération ${b} \u2014 conservez-la en sécurité`,
        heading: b => `Votre clé de récupération ${b}`,
        greeting: 'Bonjour,',
        body: b =>
            `Conservez cet e-mail en sécurité. Vous pouvez utiliser la clé de récupération ci-dessous pour retrouver l\u2019accès à votre compte ${b} si vous perdez votre appareil.`,
        codeLabel: 'Clé de récupération \u2014 NE la partagez avec PERSONNE',
        recoverInstruction: () => (
            <>
                Pour récupérer votre compte, choisissez{' '}
                <strong>&laquo;&nbsp;Récupérer par e-mail&nbsp;&raquo;</strong> dans
                l\u2019application et collez la clé de récupération ci-dessus lorsque cela vous est
                demandé.
            </>
        ),
        notRequested:
            'Si vous n\u2019êtes pas à l\u2019origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.',
        passport:
            '{brandName} est votre passeport numérique privé pour l\u2019apprentissage et le travail. Il vous permet de collecter et de partager en toute sécurité vos compétences et réalisations vérifiées en ligne.',
        sincerely: 'Cordialement,',
        subject: b => `Votre clé de récupération ${b}`,
    },
    ar: {
        preview: b => `مفتاح الاستعادة الخاص بك في ${b} \u2014 احتفظ به بأمان`,
        heading: b => `مفتاح الاستعادة الخاص بك في ${b}`,
        greeting: 'مرحبًا،',
        body: b =>
            `احتفظ بهذا البريد في مكان آمن. يمكنك استخدام مفتاح الاستعادة أدناه لاستعادة الوصول إلى حسابك في ${b} إذا فقدت جهازك.`,
        codeLabel: 'مفتاح الاستعادة \u2014 لا تشاركه مع أي شخص إطلاقًا',
        recoverInstruction: () => (
            <>
                لاستعادة حسابك، اختر <strong>&laquo;الاستعادة عبر البريد&raquo;</strong> في التطبيق
                والصق مفتاح الاستعادة أعلاه عند المطالبة بذلك.
            </>
        ),
        notRequested: 'إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.',
        passport:
            '{brandName} هو جواز سفرك الرقمي والخاص للتعلّم والعمل. يتيح لك جمع ومشاركة مهاراتك وإنجازاتك الموثّقة بأمان عبر الإنترنت.',
        sincerely: 'مع التحيات،',
        subject: b => `مفتاح الاستعادة الخاص بك في ${b}`,
    },
};

export const RecoveryKey: React.FC<RecoveryKeyProps> = ({ branding, recoveryKey, locale }) => {
    const s = STRINGS[resolveCatalogLocale(locale)];

    return (
        <Layout branding={branding} locale={locale} preview={s.preview(branding.brandName)}>
            <Text style={heading}>{s.heading(branding.brandName)}</Text>

            <Text style={paragraph}>{s.greeting}</Text>

            <Text style={paragraph}>{s.body(branding.brandName)}</Text>

            <CodeBlock code={recoveryKey} label={s.codeLabel} variant="key" />

            <Text style={paragraph}>{s.recoverInstruction()}</Text>

            <Text style={muted}>{s.notRequested}</Text>

            <Text style={paragraph}>
                {interpolate(s.passport, { brandName: branding.brandName })}
            </Text>

            <Text style={signOff}>
                {s.sincerely}
                <br />
                {interpolate(SHARED[resolveCatalogLocale(locale)].teamSignature, {
                    brandName: branding.brandName,
                })}
            </Text>
        </Layout>
    );
};

export const getRecoveryKeySubject = (branding: TenantBranding, locale?: string): string =>
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
    return (
        <RecoveryKey
            branding={DEFAULT_BRANDING}
            recoveryKey="mango-delta-fox-echo-bravo-seven-lima-niner"
        />
    );
}
