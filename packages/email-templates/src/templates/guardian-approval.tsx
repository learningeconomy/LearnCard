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
            <Text style={heading}>Guardian approval requested</Text>

            <Text style={paragraph}>
                <strong>{requesterName}</strong> has requested your approval to create an account
                on {branding.brandName}.
            </Text>

            <Text style={paragraph}>
                As their guardian, please review and approve their request by tapping the button below.
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={approvalUrl} branding={branding}>
                    Approve Account
                </EmailButton>
            </Section>

            <Text style={muted}>
                If you don&apos;t recognize this request, you can safely ignore this email.
                The request will expire automatically.
            </Text>
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
        <GuardianApproval
            branding={DEFAULT_BRANDING}
            approvalUrl="https://learncard.app/approve?token=abc123"
            approvalToken="abc123"
            requester={{ displayName: 'Alex Smith' }}
            guardian={{ email: 'parent@example.com' }}
        />
    );
}
