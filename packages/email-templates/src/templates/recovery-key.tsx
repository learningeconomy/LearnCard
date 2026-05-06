/**
 * RecoveryKey — email containing a user's account recovery key.
 *
 * Used by: lca-api keys.ts (templateAlias: RECOVERY_KEY_TEMPLATE_ALIAS)
 */

import { Text } from '@react-email/components';
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
        <Text style={heading}>Your {branding.brandName} Recovery Key</Text>

        <Text style={paragraph}>Hello,</Text>

        <Text style={paragraph}>
            Keep this email safe. You can use the recovery key below to regain access
            to your {branding.brandName} account if you lose your device.
        </Text>

        <CodeBlock code={recoveryKey} label="Recovery Key — do NOT share this with anyone" variant="key" />

        <Text style={paragraph}>
            To recover your account, choose <strong>&ldquo;Recover via Email&rdquo;</strong> in
            the app and paste the recovery key above when prompted.
        </Text>

        <Text style={muted}>
            If you did not request this, you can safely ignore this email.
        </Text>

        <Text style={paragraph}>
            {branding.brandName} is your private, digital passport for learning and work.
            It lets you securely collect and share your verified skills and achievements online.
        </Text>

        <Text style={signOff}>
            Sincerely,<br />The {branding.brandName} Team
        </Text>
    </Layout>
);

export const getRecoveryKeySubject = (branding: TenantBranding): string =>
    `Your ${branding.brandName} recovery key`;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const heading: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 24px',
};

const paragraph: React.CSSProperties = {
    fontSize: 16,
    color: '#374151',
    lineHeight: '24px',
    margin: '0 0 24px',
};

const muted: React.CSSProperties = {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: '20px',
    margin: '0 0 24px',
};

const signOff: React.CSSProperties = {
    fontSize: 14,
    color: '#374151',
    lineHeight: '20px',
    margin: '24px 0 0',
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
