/**
 * EmailVerification — link-based email verification (click a button to verify).
 *
 * Used by: brain-service contact-methods.ts (templateId: 'contact-method-verification')
 *
 * This is distinct from VerificationCode (which displays a 6-digit code).
 * Here the user receives a UUID token embedded in a CTA link.
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';
import { LinkFallback } from '../components/LinkFallback';

export interface EmailVerificationProps {
    branding: TenantBranding;
    verificationToken: string;
    recipient?: {
        name?: string;
    };
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
    branding,
    verificationToken,
    recipient,
}) => {
    const greeting = recipient?.name ? `Hello ${recipient.name},` : 'Hello,';
    const verifyUrl = `${branding.appUrl}/verify-email?token=${verificationToken}`;

    return (
        <Layout branding={branding} preview="Verify your email address">
            <Text style={heading}>Verify Your Email</Text>

            <Text style={paragraph}>{greeting}</Text>

            <Text style={paragraph}>
                Please click the button below to verify your email address.
            </Text>

            <Text style={paragraph}>
                {branding.brandName} is your private, digital passport for learning and work.
                It lets you securely collect and share your verified skills and achievements online.
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={verifyUrl} branding={branding}>
                    Verify Your Email &rarr;
                </EmailButton>
            </Section>

            <Text style={signOff}>
                Sincerely,<br />The {branding.brandName} Team
            </Text>

            <LinkFallback href={verifyUrl} />
        </Layout>
    );
};

export const getEmailVerificationSubject = (
    _branding: TenantBranding,
): string => 'Verify Your Email';

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
        <EmailVerification
            branding={DEFAULT_BRANDING}
            verificationToken="f47ac10b-58cc-4372-a567-0e02b2c3d479"
            recipient={{ name: 'Jane Doe' }}
        />
    );
}
