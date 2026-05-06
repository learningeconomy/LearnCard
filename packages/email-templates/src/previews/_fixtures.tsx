/**
 * Shared preview fixtures — reusable branding configs and data objects
 * for multi-scenario email previews.
 */

import * as React from 'react';

import { DEFAULT_BRANDING, resolveBranding } from '../branding';
import type { TenantBranding } from '../branding';

// ---------------------------------------------------------------------------
// Branding presets
// ---------------------------------------------------------------------------

export const LEARNCARD_BRANDING = DEFAULT_BRANDING;

export const VETPASS_BRANDING: TenantBranding = resolveBranding({
    brandName: 'VetPass',
    logoUrl: 'https://vetpass.app/assets/icon/icon.png',
    logoAlt: 'VetPass',
    primaryColor: '#1B5E20',
    primaryTextColor: '#ffffff',
    supportEmail: 'support@vetpass.app',
    websiteUrl: 'https://www.vetpass.app',
    appUrl: 'https://vetpass.app',
    fromDomain: 'vetpass.app',
    copyrightHolder: 'VetPass',
});

// ---------------------------------------------------------------------------
// Scenario divider — renders a labeled horizontal rule between scenarios
// ---------------------------------------------------------------------------

export const ScenarioDivider: React.FC<{ label: string }> = ({ label }) => (
    <div
        style={{
            padding: '24px 0 16px',
            textAlign: 'center',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderTop: '2px dashed #d1d5db',
            marginTop: 48,
        }}
    >
        {label}
    </div>
);
