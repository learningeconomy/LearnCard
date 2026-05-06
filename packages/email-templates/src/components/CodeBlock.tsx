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
    /** 'code' (default) for short 6-digit codes, 'key' for long recovery keys. */
    variant?: 'code' | 'key';
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, label, variant = 'code' }) => (
    <Section style={wrapper}>
        {label && <Text style={labelStyle}>{label}</Text>}

        <Text style={variant === 'key' ? keyStyle : codeStyle}>{code}</Text>
    </Section>
);

const wrapper: React.CSSProperties = {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '16px 24px',
    margin: '0 0 24px',
    textAlign: 'center' as const,
};

const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    margin: '0 0 8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
};

const codeStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 700,
    color: '#111827',
    letterSpacing: 6,
    margin: 0,
    fontFamily: "'Courier New', Courier, monospace",
};

const keyStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 400,
    color: '#111827',
    lineHeight: '20px',
    margin: 0,
    fontFamily: "'Courier New', Courier, monospace",
    wordBreak: 'break-all' as const,
};
