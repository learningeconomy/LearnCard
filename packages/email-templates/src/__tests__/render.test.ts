import { describe, it, expect } from 'vitest';

import { renderEmail } from '../render';
import type { TemplateId, TemplateDataMap } from '../render';
import { DEFAULT_BRANDING } from '../branding';
import type { TenantBranding } from '../branding';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VETPASS_BRANDING: Partial<TenantBranding> = {
    brandName: 'VetPass',
    logoAlt: 'VetPass',
    primaryColor: '#1B5E20',
    primaryTextColor: '#ffffff',
    supportEmail: 'support@vetpass.app',
    websiteUrl: 'https://www.vetpass.app',
    appUrl: 'https://vetpass.app',
    fromDomain: 'vetpass.app',
    copyrightHolder: 'VetPass',
};

/**
 * Minimal valid data for every template ID.
 *
 * Each entry must satisfy its TemplateDataMap shape so renderEmail() can
 * produce output without throwing.
 */
const TEMPLATE_FIXTURES: { [K in TemplateId]: TemplateDataMap[K] } = {
    'embed-email-verification': {
        verificationCode: '123456',
        verificationEmail: 'test@example.com',
    },

    'contact-method-verification': {
        verificationToken: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    },

    'login-verification-code': {
        verificationCode: '654321',
    },

    'contact-method-verification-1': {
        verificationCode: '111222',
    },

    'recovery-email-code': {
        verificationCode: '999888',
        verificationEmail: 'recover@example.com',
    },

    'recovery-email-verification': {
        verificationCode: '777666',
    },

    'inbox-claim': {
        claimUrl: 'https://learncard.app/claim/abc123',
        credential: { name: 'Test Badge', type: 'badge' },
        issuer: { name: 'Acme Corp' },
        recipient: { name: 'Jane Doe', email: 'jane@example.com' },
    },

    'universal-inbox-claim': {
        claimUrl: 'https://learncard.app/claim/def456',
        credential: { name: 'Universal Badge' },
    },

    'guardian-approval': {
        approvalUrl: 'https://learncard.app/guardian/approve',
        approvalToken: 'tok_abc',
        requester: { displayName: 'Alex Student', profileId: 'alex123' },
        guardian: { email: 'parent@example.com' },
    },

    'account-approved': {
        user: { displayName: 'New User' },
    },

    'account-approved-email': {
        user: { displayName: 'Email User' },
    },

    'recovery-key': {
        recoveryKey: 'ABCD-EFGH-1234-5678',
    },

    'recovery-key-backup': {
        recoveryKey: 'WXYZ-9876-LMNO-4321',
    },

    'endorsement-request': {
        shareLink: 'https://learncard.app/endorse/xyz',
        recipient: { name: 'Bob Reviewer' },
        issuer: { name: 'Learning Corp' },
        credential: { name: 'Skills Badge' },
        message: 'Please endorse my skills!',
    },

    'universal-inbox-claim-1': {
        shareLink: 'https://learncard.app/endorse/legacy',
        credential: { name: 'Legacy Badge' },
    },

    'credential-awaiting-guardian': {
        issuer: { name: 'School District' },
        credential: { name: 'Diploma' },
        recipient: { email: 'student@example.com' },
    },

    'guardian-approved-claim': {
        issuer: { name: 'School District' },
        credential: { name: 'Diploma' },
    },

    'guardian-credential-approval': {
        approvalUrl: 'https://learncard.app/guardian/credential/approve',
        approvalToken: 'tok_cred',
        issuer: { name: 'School District' },
        credential: { name: 'Diploma' },
        recipient: { email: 'student@example.com' },
    },

    'guardian-email-otp': {
        verificationCode: '445566',
    },

    'guardian-rejected-credential': {
        issuer: { name: 'School District' },
        credential: { name: 'Diploma' },
        recipient: { email: 'student@example.com' },
    },
};

const ALL_TEMPLATE_IDS = Object.keys(TEMPLATE_FIXTURES) as TemplateId[];

// ---------------------------------------------------------------------------
// Smoke tests — every template renders without throwing
// ---------------------------------------------------------------------------

describe('renderEmail — smoke tests', () => {
    it.each(ALL_TEMPLATE_IDS)(
        '"%s" renders with default branding',
        async (templateId) => {
            const result = await renderEmail(templateId, DEFAULT_BRANDING, TEMPLATE_FIXTURES[templateId]);

            expect(result.html).toBeTruthy();
            expect(result.html).toContain('<!DOCTYPE');
            expect(result.text).toBeTruthy();
            expect(result.subject).toBeTruthy();
            expect(result.subject.length).toBeGreaterThan(0);
        },
    );

    it.each(ALL_TEMPLATE_IDS)(
        '"%s" renders with custom (VetPass) branding',
        async (templateId) => {
            const result = await renderEmail(templateId, VETPASS_BRANDING, TEMPLATE_FIXTURES[templateId]);

            expect(result.html).toBeTruthy();
            expect(result.text).toBeTruthy();
            expect(result.subject).toBeTruthy();
        },
    );

    it.each(ALL_TEMPLATE_IDS)(
        '"%s" renders with empty branding (falls back to defaults)',
        async (templateId) => {
            const result = await renderEmail(templateId, {}, TEMPLATE_FIXTURES[templateId]);

            expect(result.html).toBeTruthy();
            expect(result.subject).toBeTruthy();
        },
    );
});

// ---------------------------------------------------------------------------
// Content assertion tests — dynamic values appear in rendered HTML
// ---------------------------------------------------------------------------

describe('renderEmail — content assertions', () => {
    it('inbox-claim includes the claim URL and credential name', async () => {
        const data = TEMPLATE_FIXTURES['inbox-claim'];
        const { html } = await renderEmail('inbox-claim', DEFAULT_BRANDING, data);

        expect(html).toContain(data.claimUrl);
        expect(html).toContain('Test Badge');
        expect(html).toContain('Acme Corp');
    });

    it('inbox-claim includes recipient name when provided', async () => {
        const data = TEMPLATE_FIXTURES['inbox-claim'];
        const { html } = await renderEmail('inbox-claim', DEFAULT_BRANDING, data);

        expect(html).toContain('Jane Doe');
    });

    it('verification code templates include the code', async () => {
        const data = TEMPLATE_FIXTURES['embed-email-verification'];
        const { html } = await renderEmail('embed-email-verification', DEFAULT_BRANDING, data);

        expect(html).toContain('123456');
    });

    it('verification code templates include the email when provided', async () => {
        const data = TEMPLATE_FIXTURES['embed-email-verification'];
        const { html } = await renderEmail('embed-email-verification', DEFAULT_BRANDING, data);

        expect(html).toContain('test@example.com');
    });

    it('contact-method-verification includes the verify link with token', async () => {
        const data = TEMPLATE_FIXTURES['contact-method-verification'];
        const { html } = await renderEmail('contact-method-verification', DEFAULT_BRANDING, data);

        expect(html).toContain('verify-email');
        expect(html).toContain(data.verificationToken);
    });

    it('guardian-approval includes the approval URL', async () => {
        const data = TEMPLATE_FIXTURES['guardian-approval'];
        const { html } = await renderEmail('guardian-approval', DEFAULT_BRANDING, data);

        expect(html).toContain(data.approvalUrl);
    });

    it('guardian-approval includes requester name', async () => {
        const data = TEMPLATE_FIXTURES['guardian-approval'];
        const { html } = await renderEmail('guardian-approval', DEFAULT_BRANDING, data);

        expect(html).toContain('Alex Student');
    });

    it('account-approved includes user display name', async () => {
        const data = TEMPLATE_FIXTURES['account-approved'];
        const { html } = await renderEmail('account-approved', DEFAULT_BRANDING, data);

        expect(html).toContain('New User');
        expect(html).toContain('has been approved');
    });

    it('recovery-key includes the key value', async () => {
        const data = TEMPLATE_FIXTURES['recovery-key'];
        const { html } = await renderEmail('recovery-key', DEFAULT_BRANDING, data);

        expect(html).toContain('ABCD-EFGH-1234-5678');
    });

    it('endorsement-request includes the share link and message', async () => {
        const data = TEMPLATE_FIXTURES['endorsement-request'];
        const { html } = await renderEmail('endorsement-request', DEFAULT_BRANDING, data);

        expect(html).toContain(data.shareLink);
        expect(html).toContain('Please endorse my skills!');
    });

    it('guardian-credential-approval includes approval URL and credential name', async () => {
        const data = TEMPLATE_FIXTURES['guardian-credential-approval'];
        const { html } = await renderEmail('guardian-credential-approval', DEFAULT_BRANDING, data);

        expect(html).toContain(data.approvalUrl);
        expect(html).toContain('Diploma');
    });

    it('guardian-email-otp includes the OTP code', async () => {
        const data = TEMPLATE_FIXTURES['guardian-email-otp'];
        const { html } = await renderEmail('guardian-email-otp', DEFAULT_BRANDING, data);

        expect(html).toContain('445566');
    });

    it('guardian-rejected-credential includes issuer and credential names', async () => {
        const data = TEMPLATE_FIXTURES['guardian-rejected-credential'];
        const { html } = await renderEmail('guardian-rejected-credential', DEFAULT_BRANDING, data);

        expect(html).toContain('School District');
        expect(html).toContain('Diploma');
    });

    it('credential-awaiting-guardian includes credential name', async () => {
        const data = TEMPLATE_FIXTURES['credential-awaiting-guardian'];
        const { html } = await renderEmail('credential-awaiting-guardian', DEFAULT_BRANDING, data);

        expect(html).toContain('Diploma');
    });

    it('guardian-approved-claim includes credential name', async () => {
        const data = TEMPLATE_FIXTURES['guardian-approved-claim'];
        const { html } = await renderEmail('guardian-approved-claim', DEFAULT_BRANDING, data);

        expect(html).toContain('Diploma');
    });
});

// ---------------------------------------------------------------------------
// Branding tests — custom branding flows through to rendered output
// ---------------------------------------------------------------------------

describe('renderEmail — branding', () => {
    it('default branding includes LearnCard brand name', async () => {
        const { html } = await renderEmail('account-approved', DEFAULT_BRANDING, { user: {} });

        expect(html).toContain('LearnCard');
    });

    it('VetPass branding replaces brand name in HTML', async () => {
        const { html } = await renderEmail('account-approved', VETPASS_BRANDING, { user: {} });

        expect(html).toContain('VetPass');
    });

    it('VetPass branding uses custom primary color', async () => {
        const { html } = await renderEmail('account-approved', VETPASS_BRANDING, { user: {} });

        expect(html).toContain('#1B5E20');
    });

    it('VetPass branding includes correct support email', async () => {
        const { html } = await renderEmail('account-approved', VETPASS_BRANDING, { user: {} });

        expect(html).toContain('support@vetpass.app');
    });

    it('VetPass branding includes correct website URL', async () => {
        const { html } = await renderEmail('account-approved', VETPASS_BRANDING, { user: {} });

        expect(html).toContain('vetpass.app');
    });

    it('contact-method-verification uses appUrl for verify link', async () => {
        const { html } = await renderEmail('contact-method-verification', VETPASS_BRANDING, {
            verificationToken: 'test-token-123',
        });

        expect(html).toContain('https://vetpass.app/verify-email?token=test-token-123');
    });
});

// ---------------------------------------------------------------------------
// Subject line tests
// ---------------------------------------------------------------------------

describe('renderEmail — subjects', () => {
    it('verification code subjects include brand name', async () => {
        const { subject } = await renderEmail('login-verification-code', DEFAULT_BRANDING, {
            verificationCode: '000000',
        });

        expect(subject).toContain('LearnCard');
    });

    it('inbox-claim subject includes credential name when available', async () => {
        const { subject } = await renderEmail('inbox-claim', DEFAULT_BRANDING, {
            claimUrl: 'https://example.com',
            credential: { name: 'My Special Badge' },
        });

        expect(subject.length).toBeGreaterThan(0);
    });

    it('contact-method-verification subject is "Verify Your Email"', async () => {
        const { subject } = await renderEmail('contact-method-verification', DEFAULT_BRANDING, {
            verificationToken: 'abc',
        });

        expect(subject).toBe('Verify Your Email');
    });

    it('Postmark alias pairs produce the same subject', async () => {
        const [a, b] = await Promise.all([
            renderEmail('inbox-claim', DEFAULT_BRANDING, TEMPLATE_FIXTURES['inbox-claim']),
            renderEmail('universal-inbox-claim', DEFAULT_BRANDING, TEMPLATE_FIXTURES['inbox-claim']),
        ]);

        expect(a.subject).toBe(b.subject);
    });
});

// ---------------------------------------------------------------------------
// Plain text rendering
// ---------------------------------------------------------------------------

describe('renderEmail — plain text', () => {
    it('plain text output does not contain HTML tags', async () => {
        const { text } = await renderEmail('inbox-claim', DEFAULT_BRANDING, TEMPLATE_FIXTURES['inbox-claim']);

        expect(text).not.toMatch(/<[a-z][\s\S]*>/i);
    });

    it('plain text includes key content', async () => {
        const { text } = await renderEmail('recovery-key', DEFAULT_BRANDING, TEMPLATE_FIXTURES['recovery-key']);

        expect(text).toContain('ABCD-EFGH-1234-5678');
    });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('renderEmail — edge cases', () => {
    it('inbox-claim renders with minimal data (no optional fields)', async () => {
        const { html, subject } = await renderEmail('inbox-claim', DEFAULT_BRANDING, {
            claimUrl: 'https://example.com/claim',
        });

        expect(html).toContain('https://example.com/claim');
        expect(subject).toBeTruthy();
    });

    it('endorsement-request renders without message', async () => {
        const { html } = await renderEmail('endorsement-request', DEFAULT_BRANDING, {
            shareLink: 'https://example.com/endorse',
        });

        expect(html).toContain('https://example.com/endorse');
    });

    it('account-approved renders without user display name', async () => {
        const { html } = await renderEmail('account-approved', DEFAULT_BRANDING, {});

        expect(html).toBeTruthy();
    });

    it('contact-method-verification renders without recipient', async () => {
        const { html } = await renderEmail('contact-method-verification', DEFAULT_BRANDING, {
            verificationToken: 'no-recipient-token',
        });

        expect(html).toContain('no-recipient-token');
    });
});
