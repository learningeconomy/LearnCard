/**
 * i18n tests for @learncard/email-templates (LC-1902, workstream C1).
 *
 * Asserts:
 *   1. Every template renders for every locale (en/es/fr/ar) without throwing.
 *   2. A sampled es/fr/ar subject + body differs from the EN output.
 *   3. EN output is unchanged: rendering with `locale === 'en'` or `locale === undefined`
 *      is byte-identical (the correctness gate — no behavior change for EN).
 */

import { describe, it, expect } from 'vitest';

import { renderEmail } from '../render';
import { renderSms } from '../sms';
import { DEFAULT_BRANDING } from '../branding';
import { resolveCatalogLocale, htmlDir } from '../i18n';
import type { NotificationLocale } from '../i18n';
import type { TemplateId, TemplateDataMap } from '../render';

const LOCALES: NotificationLocale[] = ['en', 'es', 'fr', 'ar'];

// Minimal valid data for every template ID.
const FIXTURES: { [K in TemplateId]: TemplateDataMap[K] } = {
    'embed-email-verification': {
        verificationCode: '123456',
        verificationEmail: 'test@example.com',
    },
    'contact-method-verification': { verificationToken: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
    'login-verification-code': { verificationCode: '654321' },
    'contact-method-verification-1': { verificationCode: '111222' },
    'recovery-email-code': { verificationCode: '999888', verificationEmail: 'recover@example.com' },
    'recovery-email-verification': { verificationCode: '777666' },
    'inbox-claim': {
        claimUrl: 'https://learncard.app/claim/abc123',
        credential: { name: 'Test Badge', type: 'badge' },
        issuer: { name: 'Acme Corp' },
        recipient: { name: 'Jane Doe' },
    },
    'universal-inbox-claim': {
        claimUrl: 'https://learncard.app/claim/abc123',
        credential: { name: 'Test Badge', type: 'badge' },
        issuer: { name: 'Acme Corp' },
    },
    'guardian-approval': {
        approvalUrl: 'https://learncard.app/approve?token=abc',
        approvalToken: 'abc',
        requester: { displayName: 'Alex Student', profileId: 'p1' },
        guardian: { email: 'parent@example.com' },
    },
    'account-approved': { user: { displayName: 'New User' } },
    'account-approved-email': { user: { displayName: 'New User' } },
    'recovery-key': { recoveryKey: 'mango-delta-fox-echo-bravo-seven-lima-niner' },
    'recovery-key-backup': { recoveryKey: 'mango-delta-fox-echo-bravo-seven-lima-niner' },
    'endorsement-request': {
        shareLink: 'https://learncard.app/share/xyz',
        recipient: { name: 'Dr. Emily Chen' },
        issuer: { name: 'John Doe' },
        credential: { name: 'Teaching Certificate' },
        message: 'Please endorse my skills!',
    },
    'universal-inbox-claim-1': {
        shareLink: 'https://learncard.app/share/xyz',
        recipient: { name: 'Dr. Emily Chen' },
        issuer: { name: 'John Doe' },
    },
    'credential-awaiting-guardian': {
        issuer: { name: 'Springfield School District' },
        credential: { name: 'Perfect Attendance Award' },
        recipient: { email: 'student@example.com' },
    },
    'guardian-approved-claim': {
        issuer: { name: 'Springfield School District' },
        credential: { name: 'Perfect Attendance Award' },
    },
    'guardian-credential-approval': {
        approvalUrl: 'https://learncard.app/guardian/approve?token=abc',
        approvalToken: 'abc',
        issuer: { name: 'Springfield School District' },
        credential: { name: 'Perfect Attendance Award' },
        recipient: { email: 'student@example.com' },
    },
    'guardian-email-otp': { verificationCode: '445566' },
    'guardian-rejected-credential': {
        issuer: { name: 'Springfield School District' },
        credential: { name: 'Perfect Attendance Award' },
        recipient: { email: 'student@example.com' },
    },
};

const ALL_TEMPLATE_IDS = Object.keys(FIXTURES) as TemplateId[];

// ---------------------------------------------------------------------------
// 1. Every template renders for every locale without throwing
// ---------------------------------------------------------------------------

describe('i18n — every template renders in every locale', () => {
    for (const templateId of ALL_TEMPLATE_IDS) {
        for (const locale of LOCALES) {
            it(`${templateId} (${locale}) renders`, async () => {
                const result = await renderEmail(
                    templateId,
                    DEFAULT_BRANDING,
                    FIXTURES[templateId],
                    locale
                );

                expect(result.html).toContain('<!DOCTYPE');
                expect(result.text.length).toBeGreaterThan(0);
                expect(result.subject.length).toBeGreaterThan(0);
            });
        }
    }
});

// ---------------------------------------------------------------------------
// 2. es/fr/ar subject + body differ from en
// ---------------------------------------------------------------------------

describe('i18n — non-EN locales localize content', () => {
    // Use a spread of representative templates; subjects are the cleanest signal.
    const SAMPLES: TemplateId[] = [
        'inbox-claim',
        'account-approved',
        'recovery-key',
        'guardian-credential-approval',
        'guardian-email-otp',
        'credential-awaiting-guardian',
    ];

    for (const templateId of SAMPLES) {
        it(`${templateId} subject + body differ per locale`, async () => {
            const en = await renderEmail(templateId, DEFAULT_BRANDING, FIXTURES[templateId], 'en');
            const subjects = new Set<string>([en.subject]);

            for (const locale of ['es', 'fr', 'ar'] as NotificationLocale[]) {
                const localized = await renderEmail(
                    templateId,
                    DEFAULT_BRANDING,
                    FIXTURES[templateId],
                    locale
                );

                // Subject should differ from EN (localized).
                expect(localized.subject).not.toBe(en.subject);
                // Body should differ from EN (the passport/sign-off copy localizes).
                expect(localized.html).not.toBe(en.html);
                // …but still render the same brand name.
                expect(localized.html).toContain(DEFAULT_BRANDING.brandName);
                // Subjects are unique across locales (no accidental aliasing).
                expect(subjects.has(localized.subject)).toBe(false);
                subjects.add(localized.subject);
            }
        });
    }

    it('renders localized footer disclaimer per locale (shared chrome)', async () => {
        const en = await renderEmail(
            'inbox-claim',
            DEFAULT_BRANDING,
            FIXTURES['inbox-claim'],
            'en'
        );
        const es = await renderEmail(
            'inbox-claim',
            DEFAULT_BRANDING,
            FIXTURES['inbox-claim'],
            'es'
        );

        // EN chrome present in EN, absent in ES.
        expect(en.text).toContain('You received this email because');
        expect(es.text).not.toContain('You received this email because');
    });
});

// ---------------------------------------------------------------------------
// 3. EN output is unchanged (correctness gate)
// ---------------------------------------------------------------------------

describe('i18n — EN is unchanged', () => {
    it('locale undefined === locale "en" (byte-identical html/text/subject)', async () => {
        for (const templateId of ALL_TEMPLATE_IDS) {
            const noLocale = await renderEmail(templateId, DEFAULT_BRANDING, FIXTURES[templateId]);
            const explicitEn = await renderEmail(
                templateId,
                DEFAULT_BRANDING,
                FIXTURES[templateId],
                'en'
            );

            expect(noLocale.subject).toBe(explicitEn.subject);
            expect(noLocale.html).toBe(explicitEn.html);
            expect(noLocale.text).toBe(explicitEn.text);
        }
    });

    it('unknown locale falls back to EN (no throw, EN subject)', async () => {
        const templateId: TemplateId = 'inbox-claim';
        const en = await renderEmail(templateId, DEFAULT_BRANDING, FIXTURES[templateId], 'en');
        const unknown = await renderEmail(
            templateId,
            DEFAULT_BRANDING,
            FIXTURES[templateId],
            'xx-XX'
        );

        expect(unknown.subject).toBe(en.subject);
        expect(unknown.html).toBe(en.html);
    });
});

// ---------------------------------------------------------------------------
// resolveCatalogLocale
// ---------------------------------------------------------------------------

describe('resolveCatalogLocale', () => {
    it('returns the supported base locale for BCP-47 input', () => {
        expect(resolveCatalogLocale('en')).toBe('en');
        expect(resolveCatalogLocale('en-US')).toBe('en');
        expect(resolveCatalogLocale('es-MX')).toBe('es');
        expect(resolveCatalogLocale('fr-CA')).toBe('fr');
        expect(resolveCatalogLocale('ar')).toBe('ar');
    });

    it('falls back to en for unsupported / missing input (never throws)', () => {
        expect(resolveCatalogLocale('de')).toBe('en');
        expect(resolveCatalogLocale('zh-CN')).toBe('en');
        expect(resolveCatalogLocale(undefined)).toBe('en');
        expect(resolveCatalogLocale(null)).toBe('en');
        expect(resolveCatalogLocale('')).toBe('en');
    });
});

// ---------------------------------------------------------------------------
// RTL direction
// ---------------------------------------------------------------------------

describe('htmlDir', () => {
    it('returns rtl for Arabic (incl. BCP-47), ltr otherwise', () => {
        expect(htmlDir('ar')).toBe('rtl');
        expect(htmlDir('ar-EG')).toBe('rtl');
        expect(htmlDir('en')).toBe('ltr');
        expect(htmlDir('es')).toBe('ltr');
        expect(htmlDir('fr')).toBe('ltr');
        expect(htmlDir(undefined)).toBe('ltr');
        expect(htmlDir('xx-XX')).toBe('ltr');
    });
});

describe('i18n — rendered <Html dir> reflects locale', () => {
    it.each(ALL_TEMPLATE_IDS)('%s renders dir="rtl" for Arabic', async templateId => {
        const ar = await renderEmail(templateId, DEFAULT_BRANDING, FIXTURES[templateId], 'ar');
        expect(ar.html).toContain('dir="rtl"');
    });

    it.each(ALL_TEMPLATE_IDS)('%s renders dir="ltr" (not rtl) for English', async templateId => {
        const en = await renderEmail(templateId, DEFAULT_BRANDING, FIXTURES[templateId], 'en');
        expect(en.html).toContain('dir="ltr"');
        expect(en.html).not.toContain('dir="rtl"');
    });
});

// ---------------------------------------------------------------------------
// SMS i18n
// ---------------------------------------------------------------------------

describe('i18n — renderSms localizes', () => {
    const inboxData = {
        claimUrl: 'https://learncard.app/claim/abc',
        recipient: { name: 'Jane' },
        issuer: { name: 'Acme' },
        credential: { name: 'Test Badge', type: 'badge' },
    };

    it('inbox-claim SMS differs per locale and brand name is interpolated', () => {
        const en = renderSms('inbox-claim', DEFAULT_BRANDING, inboxData, 'en');
        const es = renderSms('inbox-claim', DEFAULT_BRANDING, inboxData, 'es');

        expect(en).toContain('Claim it here');
        expect(es).toContain('Reclámalo aquí');
        expect(es).not.toBe(en);
        // Both carry the dynamic claim URL.
        expect(en).toContain('https://learncard.app/claim/abc');
        expect(es).toContain('https://learncard.app/claim/abc');
    });

    it('verification SMS localizes and is unchanged for EN vs undefined', () => {
        const data = { verificationToken: '999222' };
        const en = renderSms('contact-method-verification', DEFAULT_BRANDING, data, 'en');
        const undefinedLocale = renderSms('contact-method-verification', DEFAULT_BRANDING, data);
        const es = renderSms('contact-method-verification', DEFAULT_BRANDING, data, 'es');

        expect(en).toBe(undefinedLocale);
        expect(en).toContain('Your LearnCard verification code is:');
        expect(es).toContain('Tu código de verificación de LearnCard es:');
        expect(en).toContain('999222');
    });
});
