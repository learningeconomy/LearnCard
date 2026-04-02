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
    heading: string;
    description: (email: string | undefined) => string;
    expiry: string;
}> = {
    login: {
        subject: (b) => `Your ${b} login code`,
        heading: 'Sign in to your account',
        description: (email) => email
            ? `Enter this code to sign in as ${email}.`
            : 'Enter this code in the app to sign in.',
        expiry: 'This code expires in 5 minutes.',
    },
    'recovery-email': {
        subject: () => 'Verify your recovery email',
        heading: 'Verify your recovery email',
        description: (email) => email
            ? `Enter this code to verify ${email} as your recovery email.`
            : 'Enter this code to verify your recovery email address.',
        expiry: 'This code expires in 15 minutes.',
    },
    'embed-verification': {
        subject: (b) => `Your ${b} verification code`,
        heading: 'Verify your email',
        description: (email) => email
            ? `Enter this code to verify ${email}.`
            : 'Enter this code to verify your email address.',
        expiry: 'This code expires in 15 minutes.',
    },
    'contact-method': {
        subject: (b) => `Your ${b} verification code`,
        heading: 'Verify your contact method',
        description: () => 'Enter this code in the app to verify your contact information.',
        expiry: 'This code expires in 24 hours.',
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
            <Text style={heading}>{config.heading}</Text>

            <Text style={paragraph}>{config.description(verificationEmail)}</Text>

            <CodeBlock code={verificationCode} label="Verification code" />

            <Text style={muted}>{config.expiry}</Text>

            <Text style={muted}>
                If you didn&apos;t request this, you can safely ignore this email.
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
    margin: '0 0 4px',
};

const muted: React.CSSProperties = {
    fontSize: 13,
    color: '#8b91a7',
    lineHeight: '20px',
    margin: '4px 0',
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
