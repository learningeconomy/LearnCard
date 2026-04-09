/**
 * VerificationCode — shared template for all code-based verification emails.
 *
 * Used by:
 *   - login-verification-code (lca-api firebase.ts)
 *   - recovery-email-code (lca-api keys.ts)
 *   - embed-email-verification (brain-service contact-methods.ts)
 *   - contact-method-verification (brain-service contact-methods.ts)
 *
 * The `variant` prop controls the subject line and descriptive text.
 */

import { Text } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { CodeBlock } from '../components/CodeBlock';

export type VerificationCodeVariant =
    | 'login'
    | 'recovery-email'
    | 'embed-verification'
    | 'contact-method';

export interface VerificationCodeProps {
    branding: TenantBranding;
    verificationCode: string;
    verificationEmail?: string;
    variant: VerificationCodeVariant;
}

const VARIANT_CONFIG: Record<VerificationCodeVariant, {
    subject: (brandName: string) => string;
    heading: (brandName: string) => string;
    description: (email: string | undefined, brandName: string) => string;
    expiry: string;
}> = {
    login: {
        subject: (b) => `Your ${b} login code`,
        heading: (b) => `Your ${b} Login Code`,
        description: (email, b) => email
            ? `Here's your secure 6-digit code to log into ${b}`
            : `Here's your secure 6-digit code to log into ${b}`,
        expiry: 'This code will expire in 5 minutes. If you didn\u2019t request this, you can safely ignore this email.',
    },
    'recovery-email': {
        subject: () => 'Verify your recovery email',
        heading: (b) => `Your ${b} Verification Code`,
        description: (email, b) => email
            ? `Here's your secure 6-digit code to add ${email} as a recovery method for ${b}`
            : `Here's your secure 6-digit code to add a recovery method for ${b}`,
        expiry: 'This code will expire in 5 minutes. If you didn\u2019t request this, you can safely ignore this email.',
    },
    'embed-verification': {
        subject: (b) => `Your ${b} verification code`,
        heading: (b) => `Your ${b} Verification Code`,
        description: (email) => email
            ? `Enter this code to verify ${email} and claim your credential:`
            : 'Enter this code to verify your email address and claim your credential:',
        expiry: 'This code will expire in 10 minutes. If you didn\u2019t request this, you can safely ignore this email.',
    },
    'contact-method': {
        subject: (b) => `Your ${b} verification code`,
        heading: (b) => `Your ${b} Verification Code`,
        description: () => 'Enter this code in the app to verify your contact information.',
        expiry: 'This code will expire in 24 hours. If you didn\u2019t request this, you can safely ignore this email.',
    },
};

export const VerificationCode: React.FC<VerificationCodeProps> = ({
    branding,
    verificationCode,
    verificationEmail,
    variant,
}) => {
    const config = VARIANT_CONFIG[variant];

    return (
        <Layout branding={branding} preview={`Your code: ${verificationCode}`}>
            <Text style={headingStyle}>{config.heading(branding.brandName)}</Text>

            <Text style={paragraph}>Hello,</Text>

            <Text style={paragraph}>{config.description(verificationEmail, branding.brandName)}</Text>

            <CodeBlock code={verificationCode} label="Verification code" />

            <Text style={muted}>{config.expiry}</Text>

            <Text style={paragraph}>
                {branding.brandName} is your private, digital passport for learning and work.
                It lets you securely collect and share your verified skills and achievements online.
            </Text>

            <Text style={signOff}>
                Sincerely,<br />The {branding.brandName} Team
            </Text>
        </Layout>
    );
};

export const getVerificationCodeSubject = (
    branding: TenantBranding,
    variant: VerificationCodeVariant,
): string => VARIANT_CONFIG[variant].subject(branding.brandName);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const headingStyle: React.CSSProperties = {
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
// Preview (used by `pnpm dev` / react-email dev server)
// ---------------------------------------------------------------------------

export default function Preview() {
    return (
        <VerificationCode
            branding={DEFAULT_BRANDING}
            verificationCode="847293"
            verificationEmail="jane@example.com"
            variant="login"
        />
    );
}
