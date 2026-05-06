/**
 * GuardianApprovedClaim — email sent to a student when their guardian has
 * approved a credential.
 *
 * Used by: brain-service (templateAlias: 'guardian-approved-claim')
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';
import { IssuerLogo } from '../components/IssuerLogo';

export interface GuardianApprovedClaimProps {
    branding: TenantBranding;
    issuer?: {
        name?: string;
        logoUrl?: string;
    };
    credential?: {
        name?: string;
    };
}

export const GuardianApprovedClaim: React.FC<GuardianApprovedClaimProps> = ({
    branding,
    issuer,
    credential,
}) => {
    const issuerName = issuer?.name ?? 'An issuer';
    const credentialName = credential?.name;

    return (
        <Layout branding={branding} preview="Your credential has been approved by your guardian!" showHeaderLogo={false}>
            <IssuerLogo logoUrl={issuer?.logoUrl} alt={issuerName ? `${issuerName} logo` : undefined} />

            <Text style={heading}>Your credential has been approved!</Text>

            <Text style={paragraph}>Great news!</Text>

            <Text style={paragraph}>
                Your guardian has approved the credential{' '}
                {credentialName ? <><strong>&ldquo;{credentialName}&rdquo;</strong> </> : ''}
                issued by <strong>{issuerName}</strong>. It is now available in
                your {branding.brandName} account.
            </Text>

            <Text style={paragraph}>
                Open the app to see it — your credential should appear automatically.
                If you don&apos;t see it right away, try refreshing.
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={branding.appUrl} branding={branding}>
                    Open {branding.brandName} &rarr;
                </EmailButton>
            </Section>

            <Text style={signOff}>
                Sincerely,<br />The {branding.brandName} Team
            </Text>
        </Layout>
    );
};

export const getGuardianApprovedClaimSubject = (
    _branding: TenantBranding,
): string => 'Your Credential Has Been Approved!';

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
        <GuardianApprovedClaim
            branding={DEFAULT_BRANDING}
            issuer={{ name: 'Springfield School District' }}
            credential={{ name: 'Perfect Attendance Award' }}
        />
    );
}
