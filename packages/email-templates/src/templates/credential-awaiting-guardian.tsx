/**
 * CredentialAwaitingGuardian — email sent to a student/recipient when their
 * credential is pending guardian approval.
 *
 * Used by: brain-service (templateAlias: 'credential-awaiting-guardian')
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { IssuerLogo } from '../components/IssuerLogo';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale, interpolate, SHARED } from '../i18n';

export interface CredentialAwaitingGuardianProps {
    branding: TenantBranding;
    issuer?: {
        name?: string;
        logoUrl?: string;
    };
    credential?: {
        name?: string;
    };
    recipient?: {
        email?: string;
    };
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

const STRINGS: Record<
    NotificationLocale,
    {
        preview: (credentialName: string) => string;
        heading: string;
        greeting: string;
        body1: (issuerName: string, credentialName: string) => React.ReactNode;
        body2: (brandName: string) => string;
        statusBadge: string;
        muted: string;
        sincerely: string;
        subject: string;
    }
> = {
    en: {
        preview: c => `Your credential "${c}" is pending guardian approval`,
        heading: 'Pending guardian approval',
        greeting: 'Hi there,',
        body1: (issuerName, credentialName) => (
            <>
                <strong>{issuerName}</strong> has sent you the credential{' '}
                <strong>&ldquo;{credentialName}&rdquo;</strong>.
            </>
        ),
        body2: b =>
            `Before you can claim it, your guardian needs to review and approve it first. We\u2019ve already sent them a notification \u2014 once they approve, you\u2019ll receive a follow-up email and the credential will appear in your ${b} account.`,
        statusBadge: 'Awaiting Guardian Approval',
        muted: 'No action is needed from you right now.',
        sincerely: 'Sincerely,',
        subject: 'Your Credential Is Pending Guardian Approval',
    },
    es: {
        preview: c => `Tu credencial "${c}" está pendiente de aprobación del tutor`,
        heading: 'Pendiente de aprobación del tutor',
        greeting: 'Hola,',
        body1: (issuerName, credentialName) => (
            <>
                <strong>{issuerName}</strong> te ha enviado la credencial{' '}
                <strong>&ldquo;{credentialName}&rdquo;</strong>.
            </>
        ),
        body2: b =>
            `Antes de poder reclamarla, tu tutor debe revisarla y aprobarla primero. Ya le hemos enviado una notificación \u2014 cuando la apruebe, recibirás un correo de seguimiento y la credencial aparecerá en tu cuenta de ${b}.`,
        statusBadge: 'Pendiente de aprobación del tutor',
        muted: 'No necesitas realizar ninguna acción en este momento.',
        sincerely: 'Atentamente,',
        subject: 'Tu credencial está pendiente de aprobación del tutor',
    },
    fr: {
        preview: c => `Votre titre « ${c} » est en attente d\u2019approbation du tuteur`,
        heading: 'En attente d\u2019approbation du tuteur',
        greeting: 'Bonjour,',
        body1: (issuerName, credentialName) => (
            <>
                <strong>{issuerName}</strong> vous a envoyé le titre{' '}
                <strong>&laquo;&nbsp;{credentialName}&nbsp;&raquo;</strong>.
            </>
        ),
        body2: b =>
            `Avant de pouvoir le réclamer, votre tuteur doit d\u2019abord le vérifier et l\u2019approuver. Nous lui avons déjà envoyé une notification \u2014 une fois qu\u2019il aura approuvé, vous recevrez un e-mail de suivi et le titre apparaîtra dans votre compte ${b}.`,
        statusBadge: 'En attente d\u2019approbation du tuteur',
        muted: 'Aucune action n\u2019est requise de votre part pour le moment.',
        sincerely: 'Cordialement,',
        subject: 'Votre titre est en attente d\u2019approbation du tuteur',
    },
    ar: {
        preview: c => `شهادتك "${c}" بانتظار موافقة ولي الأمر`,
        heading: 'بانتظار موافقة ولي الأمر',
        greeting: 'مرحبًا،',
        body1: (issuerName, credentialName) => (
            <>
                أرسل لك <strong>{issuerName}</strong> الشهادة{' '}
                <strong>&laquo;{credentialName}&raquo;</strong>.
            </>
        ),
        body2: b =>
            `قبل أن تتمكن من المطالبة بها، يجب على ولي أمرك مراجعتها والموافقة عليها أولاً. لقد أرسلنا إليه إشعارًا بالفعل \u2014 بمجرد موافقته، ستتلقى رسالة متابعة وستظهر الشهادة في حسابك على ${b}.`,
        statusBadge: 'بانتظار موافقة ولي الأمر',
        muted: 'لا حاجة لأي إجراء منك في الوقت الحالي.',
        sincerely: 'مع التحيات،',
        subject: 'شهادتك بانتظار موافقة ولي الأمر',
    },
};

export const CredentialAwaitingGuardian: React.FC<CredentialAwaitingGuardianProps> = ({
    branding,
    issuer,
    credential,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const issuerName = issuer?.name ?? 'An issuer';
    const credentialName = credential?.name ?? 'a credential';

    return (
        <Layout
            branding={branding}
            locale={locale}
            preview={s.preview(credentialName)}
            showHeaderLogo={false}
        >
            <IssuerLogo
                logoUrl={issuer?.logoUrl}
                alt={issuerName ? `${issuerName} logo` : undefined}
            />

            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.greeting}</Text>

            <Text style={paragraph}>{s.body1(issuerName, credentialName)}</Text>

            <Text style={paragraph}>{s.body2(branding.brandName)}</Text>

            <Section style={statusBadge}>
                <Text style={statusText}>{s.statusBadge}</Text>
            </Section>

            <Text style={muted}>{s.muted}</Text>

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

export const getCredentialAwaitingGuardianSubject = (
    _branding: TenantBranding,
    locale?: string
): string => STRINGS[resolveCatalogLocale(locale)].subject;

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

const statusBadge: React.CSSProperties = {
    backgroundColor: '#f5f3ff',
    border: '1px solid #ddd6fe',
    borderRadius: 8,
    padding: '16px 24px',
    margin: '20px 0',
    textAlign: 'center' as const,
};

const statusText: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#6366f1',
    margin: 0,
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
        <CredentialAwaitingGuardian
            branding={DEFAULT_BRANDING}
            issuer={{ name: 'Springfield School District' }}
            credential={{ name: 'Perfect Attendance Award' }}
            recipient={{ email: 'student@example.com' }}
        />
    );
}
