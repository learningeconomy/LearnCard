/**
 * LinkFallback — "copy and paste this link" fallback below CTA buttons.
 *
 * Mirrors the fallback link pattern used in the original Postmark templates.
 */

import { Text, Link, Hr } from '@react-email/components';
import * as React from 'react';

interface LinkFallbackProps {
    href: string;
}

export const LinkFallback: React.FC<LinkFallbackProps> = ({ href }) => (
    <>
        <Hr style={divider} />

        <Text style={hint}>
            If you have trouble with the button above, copy and paste this link into your browser:
        </Text>

        <Text style={linkText}>
            <Link href={href} style={link}>{href}</Link>
        </Text>
    </>
);

const divider: React.CSSProperties = {
    borderColor: '#e5e7eb',
    margin: '24px 0 16px',
};

const hint: React.CSSProperties = {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: '18px',
    margin: '0 0 4px',
};

const linkText: React.CSSProperties = {
    fontSize: 12,
    lineHeight: '18px',
    margin: '0 0 4px',
    wordBreak: 'break-all' as const,
};

const link: React.CSSProperties = {
    color: '#6366f1',
    textDecoration: 'none',
};
