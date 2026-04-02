/**
 * AccountApproved — email sent when a user's account has been approved.
 *
 * Used by: brain-service inbox.ts (templateId: 'account-approved-email')
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';

export interface AccountApprovedProps {
    branding: TenantBranding;
    user?: {
        displayName?: string;
    };
}

export const AccountApproved: React.FC<AccountApprovedProps> = ({
    branding,
    user,
}) => {
    const name = user?.displayName ?? 'there';

    return (
        <Layout branding={branding} preview={`Your ${branding.brandName} account has been approved!`}>
            <Text style={heading}>You&apos;re approved!</Text>

            <Text style={paragraph}>
                Hi {name},
            </Text>

            <Text style={paragraph}>
                Your {branding.brandName} account has been approved. You now have full access
                to all features.
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={branding.appUrl} branding={branding}>
                    Open {branding.brandName}
                </EmailButton>
            </Section>
        </Layout>
    );
};

export const getAccountApprovedSubject = (branding: TenantBranding): string =>
    `Your ${branding.brandName} account has been approved`;

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

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export default function Preview() {
    return (
        <AccountApproved
            branding={DEFAULT_BRANDING}
            user={{ displayName: 'Jane Doe' }}
        />
    );
}
