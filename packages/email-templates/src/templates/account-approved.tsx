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
            <Text style={heading}>Your {branding.brandName} account has been approved!</Text>

            <Text style={paragraph}>
                Hello,
            </Text>

            <Text style={paragraph}>
                Your {branding.brandName} account has been approved by your guardian/parent.
            </Text>

            <Text style={paragraph}>
                {branding.brandName} is a private, digital passport for learning and work.
                It lets users securely collect and share their verified skills and achievements online.
            </Text>

            <Text style={paragraph}>
                Please click the button below to login to your account.
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={branding.appUrl} branding={branding}>
                    Login to {branding.brandName} &rarr;
                </EmailButton>
            </Section>

            <Text style={signOff}>
                Thank you,<br />The {branding.brandName} Team
            </Text>
        </Layout>
    );
};

export const getAccountApprovedSubject = (branding: TenantBranding): string =>
    `Your ${branding.brandName} account has been approved`;

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
        <AccountApproved
            branding={DEFAULT_BRANDING}
            user={{ displayName: 'Jane Doe' }}
        />
    );
}
