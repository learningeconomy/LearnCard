/**
 * GuardianApproval — email sent to a guardian to approve a minor's account.
 *
 * Used by: brain-service inbox.ts (templateId: 'guardian-approval')
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';
import { LinkFallback } from '../components/LinkFallback';

export interface GuardianApprovalProps {
    branding: TenantBranding;
    approvalUrl: string;
    approvalToken: string;
    requester?: {
        displayName?: string;
        profileId?: string;
    };
    guardian?: {
        email?: string;
    };
}

export const GuardianApproval: React.FC<GuardianApprovalProps> = ({
    branding,
    approvalUrl,
    requester,
}) => {
    const requesterName = requester?.displayName ?? 'Someone';

    return (
        <Layout branding={branding} preview={`${requesterName} needs your approval to join ${branding.brandName}`}>
            <Text style={heading}>Account Approval Request</Text>

            <Text style={paragraph}>Hello,</Text>

            <Text style={paragraph}>
                <strong>{requesterName}</strong> has requested approval to use their {branding.brandName} account.
            </Text>

            <Text style={paragraph}>
                {branding.brandName} is a private, digital passport for learning and work.
                It lets users securely collect and share their verified skills and achievements online.
            </Text>

            <Text style={paragraph}>
                Please click the button below to approve this account request.
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={approvalUrl} branding={branding}>
                    Approve Request &rarr;
                </EmailButton>
            </Section>

            <Text style={signOff}>
                Thank you,<br />The {branding.brandName} Team
            </Text>

            <LinkFallback href={approvalUrl} />
        </Layout>
    );
};

export const getGuardianApprovalSubject = (
    branding: TenantBranding,
    props: GuardianApprovalProps,
): string => {
    const name = props.requester?.displayName ?? 'Someone';

    return `${name} needs your approval to join ${branding.brandName}`;
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
        <GuardianApproval
            branding={DEFAULT_BRANDING}
            approvalUrl="https://learncard.app/approve?token=abc123"
            approvalToken="abc123"
            requester={{ displayName: 'Alex Smith' }}
            guardian={{ email: 'parent@example.com' }}
        />
    );
}
