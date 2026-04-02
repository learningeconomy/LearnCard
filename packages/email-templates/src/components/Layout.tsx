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
}

export const Layout: React.FC<LayoutProps> = ({ branding, preview, children }) => (
    <Html lang="en">
        <Head />

        <Preview>{preview}</Preview>

        <Body style={body}>
            <Container style={container}>
                {/* Header */}
                <Section style={header}>
                    <Img
                        src={branding.logoUrl}
                        alt={branding.logoAlt}
                        width={48}
                        height={48}
                        style={logo}
                    />

                    <Text style={brandTitle}>{branding.brandName}</Text>
                </Section>

                <Hr style={divider} />

                {/* Content */}
                <Section style={content}>
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
    backgroundColor: '#f6f6f9',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    margin: 0,
    padding: 0,
};

const container: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    margin: '40px auto',
    maxWidth: 560,
    padding: 0,
    border: '1px solid #e2e3e9',
};

const header: React.CSSProperties = {
    padding: '32px 40px 0',
    textAlign: 'center' as const,
};

const logo: React.CSSProperties = {
    borderRadius: 10,
    display: 'inline-block',
};

const brandTitle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: '#18224E',
    margin: '12px 0 0',
};

const divider: React.CSSProperties = {
    borderColor: '#e2e3e9',
    margin: '24px 40px',
};

const content: React.CSSProperties = {
    padding: '0 40px',
};

const footer: React.CSSProperties = {
    padding: '0 40px 32px',
    textAlign: 'center' as const,
};

const footerText: React.CSSProperties = {
    fontSize: 12,
    color: '#8b91a7',
    margin: '4px 0',
    lineHeight: '18px',
};

const footerLink: React.CSSProperties = {
    color: '#8b91a7',
    textDecoration: 'underline',
};
