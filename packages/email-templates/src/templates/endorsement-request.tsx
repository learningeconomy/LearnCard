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
}

export const EndorsementRequest: React.FC<EndorsementRequestProps> = ({
    branding,
    shareLink,
    recipient,
    issuer,
    credential,
    message,
}) => {
    const greeting = recipient?.name ? `Hello ${recipient.name},` : 'Hello,';
    const issuerName = issuer?.name ?? 'Someone';
    const credentialName = credential?.name;

    return (
        <Layout branding={branding} preview={`${issuerName} is requesting your endorsement`} showHeaderLogo={false}>
            <IssuerLogo logoUrl={issuer?.logoUrl} alt={issuerName ? `${issuerName} logo` : undefined} />

            <Text style={paragraph}>{greeting}</Text>

            <Text style={paragraph}>
                <strong>{issuerName}</strong> has requested an endorsement from you
                {credentialName ? <> for <strong>{credentialName}</strong></> : ''}.
            </Text>

            {message && (
                <Section style={messageBox}>
                    <Text style={messageText}>{message}</Text>

                    {issuer?.name && (
                        <Text style={messageSender}>— {issuer.name}</Text>
                    )}
                </Section>
            )}

            <Text style={paragraph}>
                {branding.brandName} is your private, digital passport for learning and work.
                It lets you securely collect and share your verified skills and achievements online.
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={shareLink} branding={branding}>
                    Endorse &rarr;
                </EmailButton>
            </Section>

            <Text style={signOff}>
                Sincerely,<br />The {branding.brandName} Team
            </Text>

            <LinkFallback href={shareLink} />
        </Layout>
    );
};

export const getEndorsementRequestSubject = (
    _branding: TenantBranding,
    props: EndorsementRequestProps,
): string => {
    const issuerName = props.issuer?.name ?? 'Someone';

    return `${issuerName} is requesting your endorsement`;
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
