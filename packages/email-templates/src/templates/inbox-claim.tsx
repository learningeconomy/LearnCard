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
import { IssuerLogo } from '../components/IssuerLogo';
import { LinkFallback } from '../components/LinkFallback';

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
        logoUrl?: string;
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
    const credentialName = credential?.name;
    const credentialType = credential?.type ?? 'record';
    const greeting = recipient?.name ? `Hello ${recipient.name},` : 'Hello,';
    const issuerName = issuer?.name;
    const issuerLogo = issuer?.logoUrl;
    const showHeaderLogo = !issuerLogo;
    
    return (
        <Layout branding={branding} preview={`Your digital ${credentialType}${issuerName ? ` from ${issuerName}` : ''} is ready`} showHeaderLogo={showHeaderLogo}>
            <IssuerLogo logoUrl={issuerLogo} alt={issuerName ? `${issuerName} logo` : undefined} />

            <Text style={heading}>Your digital {credentialType} is ready</Text>

            <Text style={paragraph}>
                {greeting}
            </Text>

            <Text style={paragraph}>
                {issuerName
                    ? <><strong>{issuerName}</strong> has sent you</>
                    : <>You&apos;ve received</>}{' '}
                a secure, digital version of your{' '}
                <strong>{credentialName ? `\u201C${credentialName}\u201D` : 'achievement'}</strong>.
            </Text>

            <Text style={paragraph}>
                {branding.brandName} is your private, digital passport for learning and work.
                It lets you securely collect and share your verified skills and achievements
                online. By claiming this item, you are saving a verifiable, official {credentialType} to
                your personal passport&mdash;one that only you control.
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={claimUrl} branding={branding}>
                    Claim Your Record &rarr;
                </EmailButton>
            </Section>

            <Text style={signOff}>
                Sincerely,<br />The {branding.brandName} Team
            </Text>

            <LinkFallback href={claimUrl} />
        </Layout>
    );
};

export const getInboxClaimSubject = (
    _branding: TenantBranding,
    props: InboxClaimProps,
): string => {
    const issuerPart = props.issuer?.name ? `from ${props.issuer.name} ` : '';

    return `Your digital record ${issuerPart}is ready`;
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
        <InboxClaim
            branding={DEFAULT_BRANDING}
            claimUrl="https://learncard.app/claim/abc123"
            recipient={{ name: 'Jane Doe' }}
            issuer={{ name: 'Acme University', logoUrl: 'https://cdn.filestackcontent.com/J6suaVcQ467W9o1k48Kj' }}
            credential={{ name: 'Bachelor of Science', type: 'Achievement' }}
        />
    );
}
