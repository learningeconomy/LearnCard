/**
 * LinkFallback — "copy and paste this link" fallback below CTA buttons.
 *
 * Mirrors the fallback link pattern used in the original Postmark templates.
 */

import { Text, Link, Hr } from '@react-email/components';
import * as React from 'react';

import { SHARED, resolveCatalogLocale } from '../i18n';

interface LinkFallbackProps {
    href: string;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

export const LinkFallback: React.FC<LinkFallbackProps> = ({ href, locale }) => {
    const chrome = SHARED[resolveCatalogLocale(locale)];

    return (
        <>
            <Hr style={divider} />

            <Text style={hint}>{chrome.linkFallbackHint}</Text>

            <Text style={linkText}>
                <Link href={href} style={link}>
                    {href}
                </Link>
            </Text>
        </>
    );
};

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
