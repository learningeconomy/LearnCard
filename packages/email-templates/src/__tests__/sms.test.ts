import { describe, it, expect } from 'vitest';

import { renderSms } from '../sms';
import { DEFAULT_BRANDING } from '../branding';
import type { TenantBranding } from '../branding';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VETPASS_BRANDING: Partial<TenantBranding> = {
    brandName: 'VetPass',
    appUrl: 'https://vetpass.app',
};

// ---------------------------------------------------------------------------
// inbox-claim SMS
// ---------------------------------------------------------------------------

describe('renderSms — inbox-claim', () => {
    it('renders a claim SMS with full data', () => {
        const body = renderSms('inbox-claim', DEFAULT_BRANDING, {
            claimUrl: 'https://learncard.app/claim/abc',
            recipient: { name: 'Jane' },
            issuer: { name: 'Acme' },
            credential: { name: 'Badge', type: 'badge' },
        });

        expect(body).toBeDefined();
        expect(body).toContain('https://learncard.app/claim/abc');
        expect(body).toContain('Jane');
        expect(body).toContain('Acme');
        expect(body).toContain('Badge');
        expect(body).toContain('badge');
    });

    it('renders without optional fields', () => {
        const body = renderSms('inbox-claim', DEFAULT_BRANDING, {
            claimUrl: 'https://learncard.app/claim/min',
        });

        expect(body).toBeDefined();
        expect(body).toContain('https://learncard.app/claim/min');
    });

    it('falls back to "credential" type when not specified', () => {
        const body = renderSms('inbox-claim', DEFAULT_BRANDING, {
            claimUrl: 'https://example.com',
            credential: { name: 'Some Cert' },
        });

        expect(body).toContain('credential');
        expect(body).toContain('Some Cert');
    });

    it('falls back to "Unnamed Credential" when name is missing', () => {
        const body = renderSms('inbox-claim', DEFAULT_BRANDING, {
            claimUrl: 'https://example.com',
        });

        expect(body).toContain('Unnamed Credential');
    });
});

// ---------------------------------------------------------------------------
// contact-method-verification SMS
// ---------------------------------------------------------------------------

describe('renderSms — contact-method-verification', () => {
    it('renders a verification SMS with the token', () => {
        const body = renderSms('contact-method-verification', DEFAULT_BRANDING, {
            verificationToken: '123456',
        });

        expect(body).toBeDefined();
        expect(body).toContain('123456');
    });

    it('includes the brand name from default branding', () => {
        const body = renderSms('contact-method-verification', DEFAULT_BRANDING, {
            verificationToken: '000000',
        });

        expect(body).toContain('LearnCard');
    });

    it('uses custom brand name with VetPass branding', () => {
        const body = renderSms('contact-method-verification', VETPASS_BRANDING, {
            verificationToken: '999999',
        });

        expect(body).toContain('VetPass');
        expect(body).not.toContain('LearnCard');
    });
});
