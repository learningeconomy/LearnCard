/**
 * EmailButton — branded CTA button for emails.
 *
 * Renders as an anchor tag with inline styles for maximum email client compatibility.
 */

import { Button } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';

interface EmailButtonProps {
    href: string;
    branding: TenantBranding;
    children: React.ReactNode;
}

export const EmailButton: React.FC<EmailButtonProps> = ({ href, branding, children }) => (
    <Button
        href={href}
        style={{
            backgroundColor: branding.primaryColor,
            color: branding.primaryTextColor,
            borderRadius: 4,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: 'none',
            textAlign: 'center' as const,
            display: 'inline-block',
            padding: '16px 24px',
            lineHeight: '1',
        }}
    >
        {children}
    </Button>
);
