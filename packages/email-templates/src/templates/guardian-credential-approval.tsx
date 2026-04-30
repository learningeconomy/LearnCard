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
}

export const GuardianCredentialApproval: React.FC<GuardianCredentialApprovalProps> = ({
    branding,
    approvalUrl,
    issuer,
    credential,
    recipient,
}) => {
    const issuerName = issuer?.name ?? 'An issuer';
    const credentialName = credential?.name ?? 'a credential';
    const recipientEmail = recipient?.email ?? 'a student';

    return (
        <Layout branding={branding} preview={`A credential needs your approval for ${recipientEmail}`} showHeaderLogo={false}>
            <IssuerLogo logoUrl={issuer?.logoUrl} alt={issuerName ? `${issuerName} logo` : undefined} />

            <Text style={heading}>A credential needs your approval</Text>

            <Text style={paragraph}>Hello,</Text>

            <Text style={paragraph}>
                <strong>{issuerName}</strong> has issued the credential{' '}
                <strong>&ldquo;{credentialName}&rdquo;</strong> to{' '}
                <strong>{recipientEmail}</strong>.
            </Text>

            <Text style={paragraph}>
                As their guardian, your approval is required before they can claim it.
                Please review the credential and approve or decline below.
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={approvalUrl} branding={branding}>
                    Review &amp; Approve &rarr;
                </EmailButton>
            </Section>

            <Text style={signOff}>
                Thank you,<br />The {branding.brandName} Team
            </Text>

            <LinkFallback href={approvalUrl} />
        </Layout>
    );
};

export const getGuardianCredentialApprovalSubject = (
    _branding: TenantBranding,
): string => 'A credential needs your approval';

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
