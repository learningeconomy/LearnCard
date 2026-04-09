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
    Hr,
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

                <Hr style={divider} />

                {/* Footer */}
                <Section style={footer}>
                    <Text style={footerText}>
                        &copy; {new Date().getFullYear()} {branding.copyrightHolder}. All rights reserved.
                    </Text>

                    <Text style={footerText}>
                        <Link href={branding.websiteUrl} style={footerLink}>{branding.websiteUrl}</Link>
                        {' · '}
                        <Link href={`mailto:${branding.supportEmail}`} style={footerLink}>{branding.supportEmail}</Link>
                    </Text>
                </Section>
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
    margin: '0 auto 40px',
    maxWidth: 600,
    padding: 0,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
};

const divider: React.CSSProperties = {
    borderColor: '#e5e7eb',
    margin: '24px 48px',
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
    padding: '48px 48px 0',
};

const contentAfterLogo: React.CSSProperties = {
    padding: '24px 48px 0',
};

const footer: React.CSSProperties = {
    padding: '0 48px 32px',
    textAlign: 'center' as const,
};

const footerText: React.CSSProperties = {
    fontSize: 12,
    color: '#6b7280',
    margin: '4px 0',
    lineHeight: '18px',
};

const footerLink: React.CSSProperties = {
    color: '#6b7280',
    textDecoration: 'underline',
};
