/**
 * GuardianEmailOtp — verification code email sent to a guardian when they
 * open an approval link and need to confirm their identity via OTP.
 *
 * Used by: brain-service (templateAlias: 'guardian-email-otp')
 */

import { Text } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { CodeBlock } from '../components/CodeBlock';

export interface GuardianEmailOtpProps {
    branding: TenantBranding;
    verificationCode: string;
}

export const GuardianEmailOtp: React.FC<GuardianEmailOtpProps> = ({
    branding,
    verificationCode,
}) => {
    return (
        <Layout branding={branding} preview={`Your verification code: ${verificationCode}`}>
            <Text style={heading}>Your verification code</Text>

            <Text style={paragraph}>Hi there,</Text>

            <Text style={paragraph}>
                Here is your verification code to confirm your identity as guardian and
                complete your review:
            </Text>

            <CodeBlock code={verificationCode} label="Verification code" />

            <Text style={muted}>
                This code expires in <strong style={{ color: '#374151' }}>1 hour</strong>.
                Do not share it with anyone.
            </Text>

            <Text style={muted}>
                If you did not request this code, you can safely ignore this email.
            </Text>

            <Text style={signOff}>
                Sincerely,<br />The {branding.brandName} Team
            </Text>
        </Layout>
    );
};

export const getGuardianEmailOtpSubject = (
    _branding: TenantBranding,
): string => 'Your Verification Code';

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
        <GuardianEmailOtp
            branding={DEFAULT_BRANDING}
            verificationCode="847293"
        />
    );
}
