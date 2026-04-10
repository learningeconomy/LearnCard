/**
 * TenantLayout — shared email wrapper with branded header + footer.
 *
 * Every email template wraps its content in this layout so branding
 * is consistent across all tenant emails.
 */

import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Img,
    Text,
    Link,
    Preview,
} from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';

interface LayoutProps {
    branding: TenantBranding;
    preview: string;
    children: React.ReactNode;
    /** Show the brand icon at the top of the card. Defaults to true.
     *  Set to false when the template already has an IssuerLogo. */
    showHeaderLogo?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ branding, preview, children, showHeaderLogo = true }) => (
    <Html lang="en">
        <Head />

        <Preview>{preview}</Preview>

        <Body style={body}>
            {/* Wordmark — sits above the white card like the Postmark layout */}
            <Container style={wordmarkContainer}>
                <Text style={wordmark}>
                    <Link href={branding.websiteUrl} style={wordmarkLink}>
                        {branding.brandName.toUpperCase()}
                    </Link>
                </Text>
            </Container>

            <Container style={container}>
                {/* Optional brand icon */}
                {showHeaderLogo && (
                    <Section style={headerLogo}>
                        <Img
                            src={branding.logoUrl}
                            alt={branding.logoAlt}
                            width={80}
                            height={80}
                            style={logoImg}
                        />
                    </Section>
                )}

                {/* Content */}
                <Section style={showHeaderLogo ? contentAfterLogo : content}>
                    {children}
                </Section>
            </Container>

            {/* Footer — sits below the white card in the gray area */}
            <Container style={footerContainer}>
                <Text style={footerDisclaimer}>
                    You received this email because someone requested to add this email
                    to their {branding.brandName} account. Please ignore this email if
                    this was not you.
                </Text>

                <Text style={footerCopyright}>
                    {branding.copyrightHolder} &copy; {new Date().getFullYear()}
                </Text>

                <Text style={footerLinks}>
                    <Link href={`mailto:${branding.supportEmail}`} style={footerLink}>
                        Contact Support
                    </Link>
                </Text>
            </Container>
        </Body>
    </Html>
);

// ---------------------------------------------------------------------------
// Styles (inline for email compatibility)
// ---------------------------------------------------------------------------

const body: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    margin: 0,
    padding: 0,
};

const wordmarkContainer: React.CSSProperties = {
    maxWidth: 560,
    margin: '40px auto 0',
    padding: '0 40px',
    textAlign: 'center' as const,
};

const wordmark: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 4,
    color: '#52597A',
    margin: '0 0 24px',
};

const wordmarkLink: React.CSSProperties = {
    color: '#52597A',
    textDecoration: 'none',
};

const container: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    margin: '0 auto',
    maxWidth: 600,
    padding: 0,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
};

const headerLogo: React.CSSProperties = {
    padding: '48px 48px 0',
    textAlign: 'center' as const,
};

const logoImg: React.CSSProperties = {
    borderRadius: 10,
    display: 'inline-block',
};

const content: React.CSSProperties = {
    padding: '48px 48px 48px',
};

const contentAfterLogo: React.CSSProperties = {
    padding: '24px 48px 48px',
};

const footerContainer: React.CSSProperties = {
    maxWidth: 560,
    margin: '0 auto',
    padding: '32px 40px 40px',
    textAlign: 'center' as const,
};

const footerDisclaimer: React.CSSProperties = {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: '18px',
    margin: '0 0 16px',
    textAlign: 'center' as const,
};

const footerCopyright: React.CSSProperties = {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: '18px',
    margin: '0 0 8px',
    textAlign: 'center' as const,
};

const footerLinks: React.CSSProperties = {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: '18px',
    margin: 0,
    textAlign: 'center' as const,
};

const footerLink: React.CSSProperties = {
    color: '#6b7280',
    textDecoration: 'underline',
};
