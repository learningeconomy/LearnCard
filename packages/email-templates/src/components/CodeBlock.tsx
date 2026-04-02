/**
 * CodeBlock — displays a verification code or recovery key prominently.
 *
 * Used by verification-code and recovery-key templates.
 */

import { Section, Text } from '@react-email/components';
import * as React from 'react';

interface CodeBlockProps {
    code: string;
    /** Optional label above the code (e.g. "Your verification code"). */
    label?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, label }) => (
    <Section style={wrapper}>
        {label && <Text style={labelStyle}>{label}</Text>}

        <Text style={codeStyle}>{code}</Text>
    </Section>
);

const wrapper: React.CSSProperties = {
    backgroundColor: '#f6f6f9',
    borderRadius: 8,
    padding: '20px 24px',
    margin: '24px 0',
    textAlign: 'center' as const,
};

const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#8b91a7',
    margin: '0 0 8px',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
};

const codeStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 700,
    color: '#18224E',
    letterSpacing: 6,
    margin: 0,
    fontFamily: "'Courier New', monospace",
};
