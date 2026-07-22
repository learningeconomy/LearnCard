/**
 * EndorsementRequest — email asking someone to endorse a credential.
 *
 * Used by: lca-api credentials.ts (templateAlias: ENDORSEMENT_REQUEST_TEMPLATE_ALIAS)
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
import { resolveCatalogLocale, interpolate, SHARED } from '../i18n';

export interface EndorsementRequestProps {
    branding: TenantBranding;
    shareLink: string;
    recipient?: {
        name?: string;
        email?: string;
    };
    issuer?: {
        name?: string;
        logoUrl?: string;
    };
    credential?: {
        name?: string;
        type?: string;
    };
    message?: string;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

const STRINGS: Record<
    NotificationLocale,
    {
        preview: (issuerName: string) => string;
        greeting: string;
        greetingName: string;
        body: (issuerName: string, credentialName: string | undefined) => React.ReactNode;
        passport: string;
        button: string;
        sincerely: string;
        subject: (issuerName: string) => string;
    }
> = {
    en: {
        preview: i => `${i} is requesting your endorsement`,
        greeting: 'Hello,',
        greetingName: 'Hello {name},',
        body: (issuerName, credentialName) => (
            <>
                <strong>{issuerName}</strong> has requested an endorsement from you
                {credentialName ? (
                    <>
                        {' '}
                        for <strong>{credentialName}</strong>
                    </>
                ) : (
                    ''
                )}
                .
            </>
        ),
        passport:
            '{brandName} is your private, digital passport for learning and work. It lets you securely collect and share your verified skills and achievements online.',
        button: 'Endorse \u2192',
        sincerely: 'Sincerely,',
        subject: i => `${i} is requesting your endorsement`,
    },
    es: {
        preview: i => `${i} solicita tu validación`,
        greeting: 'Hola,',
        greetingName: 'Hola {name},',
        body: (issuerName, credentialName) => (
            <>
                <strong>{issuerName}</strong> te ha solicitado una validación
                {credentialName ? (
                    <>
                        {' '}
                        para <strong>{credentialName}</strong>
                    </>
                ) : (
                    ''
                )}
                .
            </>
        ),
        passport:
            '{brandName} es tu pasaporte digital y privado para el aprendizaje y el trabajo. Te permite recopilar y compartir de forma segura tus habilidades y logros verificados en línea.',
        button: 'Validar \u2192',
        sincerely: 'Atentamente,',
        subject: i => `${i} solicita tu validación`,
    },
    fr: {
        preview: i => `${i} vous demande une validation`,
        greeting: 'Bonjour,',
        greetingName: 'Bonjour {name},',
        body: (issuerName, credentialName) => (
            <>
                <strong>{issuerName}</strong> vous a demandé une validation
                {credentialName ? (
                    <>
                        {' '}
                        pour <strong>{credentialName}</strong>
                    </>
                ) : (
                    ''
                )}
                .
            </>
        ),
        passport:
            '{brandName} est votre passeport numérique privé pour l\u2019apprentissage et le travail. Il vous permet de collecter et de partager en toute sécurité vos compétences et réalisations vérifiées en ligne.',
        button: 'Valider \u2192',
        sincerely: 'Cordialement,',
        subject: i => `${i} vous demande une validation`,
    },
    ar: {
        preview: i => `${i} يطلب منك التأييد`,
        greeting: 'مرحبًا،',
        greetingName: 'مرحبًا {name}،',
        body: (issuerName, credentialName) => (
            <>
                طلب <strong>{issuerName}</strong> منك تأييدًا
                {credentialName ? (
                    <>
                        {' '}
                        لـ <strong>{credentialName}</strong>
                    </>
                ) : (
                    ''
                )}
                .
            </>
        ),
        passport:
            '{brandName} هو جواز سفرك الرقمي والخاص للتعلّم والعمل. يتيح لك جمع ومشاركة مهاراتك وإنجازاتك الموثّقة بأمان عبر الإنترنت.',
        button: 'تأييد ←',
        sincerely: 'مع التحيات،',
        subject: i => `${i} يطلب منك التأييد`,
    },
};

export const EndorsementRequest: React.FC<EndorsementRequestProps> = ({
    branding,
    shareLink,
    recipient,
    issuer,
    credential,
    message,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const greeting = interpolate(recipient?.name ? s.greetingName : s.greeting, {
        name: recipient?.name,
    });
    const issuerName = issuer?.name ?? 'Someone';
    const credentialName = credential?.name;

    return (
        <Layout
            branding={branding}
            locale={locale}
            preview={s.preview(issuerName)}
            showHeaderLogo={false}
        >
            <IssuerLogo
                logoUrl={issuer?.logoUrl}
                alt={issuerName ? `${issuerName} logo` : undefined}
            />

            <Text style={paragraph}>{greeting}</Text>

            <Text style={paragraph}>{s.body(issuerName, credentialName)}</Text>

            {message && (
                <Section style={messageBox}>
                    <Text style={messageText}>{message}</Text>

                    {issuer?.name && <Text style={messageSender}>— {issuer.name}</Text>}
                </Section>
            )}

            <Text style={paragraph}>
                {interpolate(s.passport, { brandName: branding.brandName })}
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={shareLink} branding={branding}>
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

            <LinkFallback href={shareLink} locale={locale} />
        </Layout>
    );
};

export const getEndorsementRequestSubject = (
    _branding: TenantBranding,
    props: EndorsementRequestProps,
    locale?: string
): string => {
    const issuerName = props.issuer?.name ?? 'Someone';
    return STRINGS[resolveCatalogLocale(locale)].subject(issuerName);
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const paragraph: React.CSSProperties = {
    fontSize: 16,
    color: '#374151',
    lineHeight: '24px',
    margin: '0 0 24px',
};

const messageBox: React.CSSProperties = {
    backgroundColor: '#f6f6f9',
    borderRadius: 8,
    padding: '16px 20px',
    margin: '16px 0',
    borderLeft: '3px solid #C5C8D3',
};

const messageText: React.CSSProperties = {
    fontSize: 15,
    color: '#111827',
    lineHeight: '22px',
    margin: 0,
    textAlign: 'left' as const,
};

const messageSender: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    margin: '12px 0 0',
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
        <EndorsementRequest
            branding={DEFAULT_BRANDING}
            shareLink="https://learncard.app/share/xyz789"
            recipient={{ name: 'Dr. Emily Chen' }}
            issuer={{ name: 'John Doe' }}
            credential={{ name: 'Professional Teaching Certificate' }}
            message="I would greatly appreciate your endorsement of my teaching credential. We worked together at Springfield Academy for 3 years."
        />
    );
}
