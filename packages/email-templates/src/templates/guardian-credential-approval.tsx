/**
 * GuardianCredentialApproval — email sent to a guardian asking them to
 * approve or decline a specific credential issued to their ward.
 *
 * Used by: brain-service (templateAlias: 'guardian-credential-approval')
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';
import { IssuerLogo } from '../components/IssuerLogo';
import { LinkFallback } from '../components/LinkFallback';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale } from '../i18n';

export interface GuardianCredentialApprovalProps {
    branding: TenantBranding;
    approvalUrl: string;
    approvalToken?: string;
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
        preview: (recipientEmail: string) => string;
        heading: string;
        greeting: string;
        body: (
            issuerName: string,
            credentialName: string,
            recipientEmail: string
        ) => React.ReactNode;
        review: string;
        button: string;
        thankYou: string;
        subject: string;
    }
> = {
    en: {
        preview: r => `A credential needs your approval for ${r}`,
        heading: 'A credential needs your approval',
        greeting: 'Hello,',
        body: (issuerName, credentialName, recipientEmail) => (
            <>
                <strong>{issuerName}</strong> has issued the credential{' '}
                <strong>&ldquo;{credentialName}&rdquo;</strong> to <strong>{recipientEmail}</strong>
                .
            </>
        ),
        review: 'As their guardian, your approval is required before they can claim it. Please review the credential and approve or decline below.',
        button: 'Review &amp; Approve \u2192',
        thankYou: 'Thank you,',
        subject: 'A credential needs your approval',
    },
    es: {
        preview: r => `Una credencial necesita tu aprobación para ${r}`,
        heading: 'Una credencial necesita tu aprobación',
        greeting: 'Hola,',
        body: (issuerName, credentialName, recipientEmail) => (
            <>
                <strong>{issuerName}</strong> ha emitido la credencial{' '}
                <strong>&ldquo;{credentialName}&rdquo;</strong> para{' '}
                <strong>{recipientEmail}</strong>.
            </>
        ),
        review: 'Como su tutor, se requiere tu aprobación antes de que pueda reclamarla. Revisa la credencial y apruébala o recházala a continuación.',
        button: 'Revisar y aprobar \u2192',
        thankYou: 'Gracias,',
        subject: 'Una credencial necesita tu aprobación',
    },
    fr: {
        preview: r => `Un titre nécessite votre approbation pour ${r}`,
        heading: 'Un titre nécessite votre approbation',
        greeting: 'Bonjour,',
        body: (issuerName, credentialName, recipientEmail) => (
            <>
                <strong>{issuerName}</strong> a émis le titre{' '}
                <strong>&laquo;&nbsp;{credentialName}&nbsp;&raquo;</strong> pour{' '}
                <strong>{recipientEmail}</strong>.
            </>
        ),
        review: 'En tant que son tuteur, votre approbation est requise avant qu\u2019il puisse le réclamer. Veuillez vérifier le titre et l\u2019approuver ou le refuser ci-dessous.',
        button: 'Vérifier &amp; approuver \u2192',
        thankYou: 'Merci,',
        subject: 'Un titre nécessite votre approbation',
    },
    ar: {
        preview: r => `شهادة بحاجة إلى موافقتك من أجل ${r}`,
        heading: 'شهادة بحاجة إلى موافقتك',
        greeting: 'مرحبًا،',
        body: (issuerName, credentialName, recipientEmail) => (
            <>
                أصدر <strong>{issuerName}</strong> الشهادة{' '}
                <strong>&laquo;{credentialName}&raquo;</strong> لـ <strong>{recipientEmail}</strong>
                .
            </>
        ),
        review: 'بصفتك ولي أمره، موافقتك مطلوبة قبل أن يتمكن من المطالبة بها. يرجى مراجعة الشهادة والموافقة عليها أو رفضها أدناه.',
        button: 'مراجعة وموافقة ←',
        thankYou: 'شكرًا،',
        subject: 'شهادة بحاجة إلى موافقتك',
    },
};

export const GuardianCredentialApproval: React.FC<GuardianCredentialApprovalProps> = ({
    branding,
    approvalUrl,
    issuer,
    credential,
    recipient,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const issuerName = issuer?.name ?? 'An issuer';
    const credentialName = credential?.name ?? 'a credential';
    const recipientEmail = recipient?.email ?? 'a student';

    return (
        <Layout
            branding={branding}
            locale={locale}
            preview={s.preview(recipientEmail)}
            showHeaderLogo={false}
        >
            <IssuerLogo
                logoUrl={issuer?.logoUrl}
                alt={issuerName ? `${issuerName} logo` : undefined}
            />

            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.greeting}</Text>

            <Text style={paragraph}>{s.body(issuerName, credentialName, recipientEmail)}</Text>

            <Text style={paragraph}>{s.review}</Text>

            <Section style={buttonWrapper}>
                <EmailButton href={approvalUrl} branding={branding}>
                    {s.button}
                </EmailButton>
            </Section>

            <Text style={signOff}>
                {s.thankYou}
                <br />
                The {branding.brandName} Team
            </Text>

            <LinkFallback href={approvalUrl} locale={locale} />
        </Layout>
    );
};

export const getGuardianCredentialApprovalSubject = (
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
        <GuardianCredentialApproval
            branding={DEFAULT_BRANDING}
            approvalUrl="https://learncard.app/guardian/approve?token=abc123"
            approvalToken="abc123"
            issuer={{ name: 'Springfield School District' }}
            credential={{ name: 'Perfect Attendance Award' }}
            recipient={{ email: 'student@example.com' }}
        />
    );
}
