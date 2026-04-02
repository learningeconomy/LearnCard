/**
 * InboxClaim — email notifying a recipient they have a credential to claim.
 *
 * Used by: brain-service inbox.helpers.ts (templateId: 'universal-inbox-claim')
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';

export interface InboxClaimProps {
    branding: TenantBranding;
    claimUrl: string;
    recipient?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    issuer?: {
        name?: string;
    };
    credential?: {
        name?: string;
        type?: string;
    };
}

export const InboxClaim: React.FC<InboxClaimProps> = ({
    branding,
    claimUrl,
    recipient,
    issuer,
    credential,
}) => {
    const credentialName = credential?.name ?? 'a credential';
    const greeting = recipient?.name ? `Hi ${recipient.name},` : 'Hi there,';
    const issuerLine = issuer?.name ? ` from ${issuer.name}` : '';

    return (
        <Layout branding={branding} preview={`You have ${credentialName} to claim${issuerLine}`}>
            <Text style={heading}>You have a credential to claim</Text>

            <Text style={paragraph}>
                {greeting}
            </Text>

            <Text style={paragraph}>
                You&apos;ve been issued <strong>{credentialName}</strong>{issuerLine}.
                Tap the button below to claim it in {branding.brandName}.
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={claimUrl} branding={branding}>
                    Claim Credential
                </EmailButton>
            </Section>

            <Text style={muted}>
                If you weren&apos;t expecting this, you can safely ignore this email.
            </Text>
        </Layout>
    );
};

export const getInboxClaimSubject = (
    branding: TenantBranding,
    props: InboxClaimProps,
): string => {
    const credName = props.credential?.name ?? 'A credential';
    const issuerPart = props.issuer?.name ? ` from ${props.issuer.name}` : '';

    return `${credName}${issuerPart} — claim it on ${branding.brandName}`;
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
        <InboxClaim
            branding={DEFAULT_BRANDING}
            claimUrl="https://learncard.app/claim/abc123"
            recipient={{ name: 'Jane Doe' }}
            issuer={{ name: 'Acme University' }}
            credential={{ name: 'Bachelor of Science', type: 'Achievement' }}
        />
    );
}
