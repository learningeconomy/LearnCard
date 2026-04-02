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

export interface EndorsementRequestProps {
    branding: TenantBranding;
    shareLink: string;
    recipient?: {
        name?: string;
    };
    issuer?: {
        name?: string;
    };
    credential?: {
        name?: string;
    };
    message?: string;
}

export const EndorsementRequest: React.FC<EndorsementRequestProps> = ({
    branding,
    shareLink,
    recipient,
    issuer,
    message,
}) => {
    const greeting = recipient?.name ? `Hi ${recipient.name},` : 'Hi there,';
    const issuerName = issuer?.name ?? 'Someone';

    return (
        <Layout branding={branding} preview={`${issuerName} is requesting your endorsement`}>
            <Text style={heading}>Endorsement requested</Text>

            <Text style={paragraph}>{greeting}</Text>

            <Text style={paragraph}>
                <strong>{issuerName}</strong> has requested your endorsement on {branding.brandName}.
            </Text>

            {message && (
                <Section style={messageBox}>
                    <Text style={messageText}>&ldquo;{message}&rdquo;</Text>
                </Section>
            )}

            <Section style={buttonWrapper}>
                <EmailButton href={shareLink} branding={branding}>
                    Review &amp; Endorse
                </EmailButton>
            </Section>

            <Text style={muted}>
                If you don&apos;t recognize this request, you can safely ignore this email.
            </Text>
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

const heading: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    color: '#18224E',
    margin: '0 0 12px',
};

const paragraph: React.CSSProperties = {
    fontSize: 14,
    color: '#52597A',
    lineHeight: '22px',
    margin: '0 0 12px',
};

const messageBox: React.CSSProperties = {
    backgroundColor: '#f6f6f9',
    borderRadius: 8,
    padding: '16px 20px',
    margin: '16px 0',
    borderLeft: '3px solid #C5C8D3',
};

const messageText: React.CSSProperties = {
    fontSize: 14,
    color: '#52597A',
    fontStyle: 'italic' as const,
    lineHeight: '22px',
    margin: 0,
};

const buttonWrapper: React.CSSProperties = {
    textAlign: 'center' as const,
    margin: '28px 0',
};

const muted: React.CSSProperties = {
    fontSize: 13,
    color: '#8b91a7',
    lineHeight: '20px',
    margin: '4px 0',
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
