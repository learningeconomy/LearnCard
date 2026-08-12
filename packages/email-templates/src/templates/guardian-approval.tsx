/**
 * GuardianApproval — email sent to a guardian to approve a minor's account.
 *
 * Used by: brain-service inbox.ts (templateId: 'guardian-approval')
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

export interface GuardianApprovalProps {
    branding: TenantBranding;
    approvalUrl: string;
    approvalToken: string;
    requester?: {
        displayName?: string;
        profileId?: string;
    };
    guardian?: {
        email?: string;
    };
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

const STRINGS: Record<
    NotificationLocale,
    {
        preview: (requesterName: string, brandName: string) => string;
        heading: string;
        greeting: string;
        body: (requesterName: string, brandName: string) => React.ReactNode;
        passport: string;
        ctaInstruction: string;
        button: string;
        thankYou: string;
        subject: (requesterName: string, brandName: string) => string;
    }
> = {
    en: {
        preview: (n, b) => `${n} needs your approval to join ${b}`,
        heading: 'Account Approval Request',
        greeting: 'Hello,',
        body: (n, b) => (
            <>
                <strong>{n}</strong> has requested approval to use their {b} account.
            </>
        ),
        passport:
            '{brandName} is a private, digital passport for learning and work. It lets users securely collect and share their verified skills and achievements online.',
        ctaInstruction: 'Please click the button below to approve this account request.',
        button: 'Approve Request \u2192',
        thankYou: 'Thank you,',
        subject: (n, b) => `${n} needs your approval to join ${b}`,
    },
    es: {
        preview: (n, b) => `${n} necesita tu aprobación para unirse a ${b}`,
        heading: 'Solicitud de aprobación de cuenta',
        greeting: 'Hola,',
        body: (n, b) => (
            <>
                <strong>{n}</strong> ha solicitado aprobación para usar su cuenta de {b}.
            </>
        ),
        passport:
            '{brandName} es un pasaporte digital y privado para el aprendizaje y el trabajo. Permite a los usuarios recopilar y compartir de forma segura sus habilidades y logros verificados en línea.',
        ctaInstruction: 'Haz clic en el botón siguiente para aprobar esta solicitud de cuenta.',
        button: 'Aprobar solicitud \u2192',
        thankYou: 'Gracias,',
        subject: (n, b) => `${n} necesita tu aprobación para unirse a ${b}`,
    },
    fr: {
        preview: (n, b) => `${n} a besoin de votre approbation pour rejoindre ${b}`,
        heading: "Demande d'approbation de compte",
        greeting: 'Bonjour,',
        body: (n, b) => (
            <>
                <strong>{n}</strong> a demandé l\u2019approbation pour utiliser son compte {b}.
            </>
        ),
        passport:
            '{brandName} est un passeport numérique privé pour l\u2019apprentissage et le travail. Il permet aux utilisateurs de collecter et de partager en toute sécurité leurs compétences et réalisations vérifiées en ligne.',
        ctaInstruction:
            'Veuillez cliquer sur le bouton ci-dessous pour approuver cette demande de compte.',
        button: 'Approuver la demande \u2192',
        thankYou: 'Merci,',
        subject: (n, b) => `${n} a besoin de votre approbation pour rejoindre ${b}`,
    },
    ar: {
        preview: (n, b) => `${n} بحاجة إلى موافقتك للانضمام إلى ${b}`,
        heading: 'طلب الموافقة على الحساب',
        greeting: 'مرحبًا،',
        body: (n, b) => (
            <>
                طلب <strong>{n}</strong> الموافقة لاستخدام حسابه في {b}.
            </>
        ),
        passport:
            '{brandName} هو جواز سفر رقمي خاص للتعلّم والعمل. يتيح للمستخدمين جمع ومشاركة مهاراتهم وإنجازاتهم الموثّقة بأمان عبر الإنترنت.',
        ctaInstruction: 'يرجى النقر على الزر أدناه للموافقة على طلب الحساب هذا.',
        button: 'الموافقة على الطلب ←',
        thankYou: 'شكرًا،',
        subject: (n, b) => `${n} بحاجة إلى موافقتك للانضمام إلى ${b}`,
    },
};

export const GuardianApproval: React.FC<GuardianApprovalProps> = ({
    branding,
    approvalUrl,
    requester,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const requesterName = requester?.displayName ?? 'Someone';

    return (
        <Layout
            branding={branding}
            locale={locale}
            preview={s.preview(requesterName, branding.brandName)}
        >
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.greeting}</Text>

            <Text style={paragraph}>{s.body(requesterName, branding.brandName)}</Text>

            <Text style={paragraph}>
                {interpolate(s.passport, { brandName: branding.brandName })}
            </Text>

            <Text style={paragraph}>{s.ctaInstruction}</Text>

            <Section style={buttonWrapper}>
                <EmailButton href={approvalUrl} branding={branding}>
                    {s.button}
                </EmailButton>
            </Section>

            <Text style={signOff}>
                {s.thankYou}
                <br />
                {interpolate(SHARED[resolveCatalogLocale(locale)].teamSignature, {
                    brandName: branding.brandName,
                })}
            </Text>

            <LinkFallback href={approvalUrl} locale={locale} />
        </Layout>
    );
};

export const getGuardianApprovalSubject = (
    branding: TenantBranding,
    props: GuardianApprovalProps,
    locale?: string
): string => {
    const name = props.requester?.displayName ?? 'Someone';
    return STRINGS[resolveCatalogLocale(locale)].subject(name, branding.brandName);
};

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
        <GuardianApproval
            branding={DEFAULT_BRANDING}
            approvalUrl="https://learncard.app/approve?token=abc123"
            approvalToken="abc123"
            requester={{ displayName: 'Alex Smith' }}
            guardian={{ email: 'parent@example.com' }}
        />
    );
}
