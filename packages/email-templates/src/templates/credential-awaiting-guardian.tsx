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
}

export const CredentialAwaitingGuardian: React.FC<CredentialAwaitingGuardianProps> = ({
    branding,
    issuer,
    credential,
}) => {
    const issuerName = issuer?.name ?? 'An issuer';
    const credentialName = credential?.name ?? 'a credential';

    return (
        <Layout branding={branding} preview={`Your credential "${credentialName}" is pending guardian approval`} showHeaderLogo={false}>
            <IssuerLogo logoUrl={issuer?.logoUrl} alt={issuerName ? `${issuerName} logo` : undefined} />

            <Text style={heading}>Pending guardian approval</Text>

            <Text style={paragraph}>Hi there,</Text>

            <Text style={paragraph}>
                <strong>{issuerName}</strong> has sent you the credential{' '}
                <strong>&ldquo;{credentialName}&rdquo;</strong>.
            </Text>

            <Text style={paragraph}>
                Before you can claim it, your guardian needs to review and approve it first.
                We&apos;ve already sent them a notification — once they approve, you&apos;ll receive
                a follow-up email and the credential will appear in your {branding.brandName} account.
            </Text>

            <Section style={statusBadge}>
                <Text style={statusText}>Awaiting Guardian Approval</Text>
            </Section>

            <Text style={muted}>
                No action is needed from you right now.
            </Text>

            <Text style={signOff}>
                Sincerely,<br />The {branding.brandName} Team
            </Text>
        </Layout>
    );
};

export const getCredentialAwaitingGuardianSubject = (
    _branding: TenantBranding,
): string => 'Your Credential Is Pending Guardian Approval';

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
