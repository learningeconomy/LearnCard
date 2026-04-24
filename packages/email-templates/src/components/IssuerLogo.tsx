/**
 * IssuerLogo — circular avatar for the credential issuer.
 *
 * Mirrors the 80×80 circular logo used in the original Postmark templates.
 * Only renders when `logoUrl` is provided; otherwise renders nothing.
 */

import { Img, Section } from '@react-email/components';
import * as React from 'react';

interface IssuerLogoProps {
    logoUrl?: string;
    alt?: string;
}

export const IssuerLogo: React.FC<IssuerLogoProps> = ({ logoUrl, alt }) => {
    if (!logoUrl) return null;

    return (
        <Section style={wrapper}>
            <Img
                src={logoUrl}
                alt={alt ?? 'Issuer logo'}
                width={80}
                height={80}
                style={avatar}
            />
        </Section>
    );
};

const wrapper: React.CSSProperties = {
    textAlign: 'center' as const,
    margin: '0 0 24px',
};

const avatar: React.CSSProperties = {
    borderRadius: '50%',
    display: 'inline-block',
    objectFit: 'cover',
};
