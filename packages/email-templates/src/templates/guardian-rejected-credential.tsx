/**
 * GuardianRejectedCredential — email sent to a student when their guardian
 * has declined to approve a credential.
 *
 * Used by: brain-service (templateAlias: 'guardian-rejected-credential')
 */

import { Text } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';

export interface GuardianRejectedCredentialProps {
    branding: TenantBranding;
    issuer?: {
        name?: string;
    };
    credential?: {
        name?: string;
    };
    recipient?: {
        email?: string;
    };
}

export const GuardianRejectedCredential: React.FC<GuardianRejectedCredentialProps> = ({
    branding,
    issuer,
    credential,
}) => {
    const issuerName = issuer?.name ?? 'An issuer';
    const credentialName = credential?.name;

    return (
        <Layout branding={branding} preview="Your guardian has declined a credential">
            <Text style={heading}>Credential not approved</Text>

            <Text style={paragraph}>Hi there,</Text>

            <Text style={paragraph}>
                Your guardian has reviewed and <strong>declined</strong> the credential{' '}
                {credentialName ? <><strong>&ldquo;{credentialName}&rdquo;</strong> </> : ''}
                issued by <strong>{issuerName}</strong>.
            </Text>

            <Text style={paragraph}>
                The credential will not be added to your account. If you think this was
                a mistake, please reach out to your guardian or contact{' '}
                <strong>{issuerName}</strong> directly.
            </Text>

            <Text style={signOff}>
                Sincerely,<br />The {branding.brandName} Team
            </Text>
        </Layout>
    );
};

export const getGuardianRejectedCredentialSubject = (
    _branding: TenantBranding,
): string => 'Credential Not Approved';

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
        <GuardianRejectedCredential
            branding={DEFAULT_BRANDING}
            issuer={{ name: 'Springfield School District' }}
            credential={{ name: 'Perfect Attendance Award' }}
            recipient={{ email: 'student@example.com' }}
        />
    );
}
