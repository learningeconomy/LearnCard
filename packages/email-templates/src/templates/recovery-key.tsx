/**
 * RecoveryKey — email containing a user's account recovery key.
 *
 * Used by: lca-api keys.ts (templateAlias: RECOVERY_KEY_TEMPLATE_ALIAS)
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { CodeBlock } from '../components/CodeBlock';

export interface RecoveryKeyProps {
    branding: TenantBranding;
    recoveryKey: string;
}

export const RecoveryKey: React.FC<RecoveryKeyProps> = ({
    branding,
    recoveryKey,
}) => (
    <Layout branding={branding} preview={`Your ${branding.brandName} recovery key — keep this safe`}>
        <Text style={heading}>Your recovery key</Text>

        <Text style={paragraph}>
            Keep this email safe. You can use the recovery key below to regain access
            to your {branding.brandName} account if you lose your device.
        </Text>

        <CodeBlock code={recoveryKey} label="Recovery key" />

        <Section style={warningBox}>
            <Text style={warningText}>
                <strong>Do NOT share this key with anyone.</strong> {branding.brandName} will never
                ask you for your recovery key.
            </Text>
        </Section>

        <Text style={muted}>
            If you did not request this, please contact{' '}
            <a href={`mailto:${branding.supportEmail}`} style={{ color: '#8b91a7' }}>
                {branding.supportEmail}
            </a>{' '}
            immediately.
        </Text>
    </Layout>
);

export const getRecoveryKeySubject = (branding: TenantBranding): string =>
    `Your ${branding.brandName} recovery key`;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const heading: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    color: '#18224E',
    margin: '0 0 12px',
};

const paragraph: React.CSSProperties = {
    fontSize: 14,
    color: '#52597A',
    lineHeight: '22px',
    margin: '0 0 12px',
};

const warningBox: React.CSSProperties = {
    backgroundColor: '#FFF8E1',
    border: '1px solid #FFE082',
    borderRadius: 8,
    padding: '16px 20px',
    margin: '20px 0',
};

const warningText: React.CSSProperties = {
    fontSize: 13,
    color: '#6F7590',
    margin: 0,
    lineHeight: '20px',
};

const muted: React.CSSProperties = {
    fontSize: 13,
    color: '#8b91a7',
    lineHeight: '20px',
    margin: '4px 0',
};

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export default function Preview() {
    return (
        <RecoveryKey
            branding={DEFAULT_BRANDING}
            recoveryKey="mango-delta-fox-echo-bravo-seven-lima-niner"
        />
    );
}
