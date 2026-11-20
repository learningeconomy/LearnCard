import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderEmail } from '@learncard/email-templates';
import devConfig from '../config/config.dev.json';
import productionConfig from '../config/config.production.json';
import scoutsDevConfig from '../config/config.scouts.dev.json';
import scoutsProductionConfig from '../config/config.scouts.production.json';

const mocks = vi.hoisted(() => ({
    environment: { EMAIL_APP_ORIGINS: undefined as string | undefined, IS_OFFLINE: false },
}));
vi.mock('@environment', () => ({ environment: mocks.environment }));
import { getEmailActionBranding } from '../src/helpers/email-action-branding.helpers';

beforeEach(() => {
    mocks.environment.EMAIL_APP_ORIGINS = undefined;
    mocks.environment.IS_OFFLINE = false;
});

describe('deployment-owned email action origins', () => {
    it.each([
        ['learncard', devConfig, 'https://staging.learncard.ai'],
        ['vetpass', devConfig, 'https://staging.vetpass.app'],
        ['scoutpass', scoutsDevConfig, 'https://staging.pass.scout.org'],
        ['learncard', productionConfig, 'https://learncard.app'],
        ['vetpass', productionConfig, 'https://vetpass.app'],
        ['scoutpass', scoutsProductionConfig, 'https://pass.scout.org'],
    ] as const)(
        'uses %s deployment origin in both action emails',
        async (tenant, config, origin) => {
            mocks.environment.EMAIL_APP_ORIGINS = config.EMAIL_APP_ORIGINS;
            // Simulate an older queued invitation with the previously wrong app URL.
            const branding = getEmailActionBranding(tenant, {
                brandName: 'Tenant',
                appUrl: 'https://wrong-environment.example',
            });
            expect(branding).toMatchObject({ brandName: 'Tenant', appUrl: origin });

            const verification = await renderEmail('contact-method-verification', branding, {
                verificationToken: 'synthetic-token',
            });
            expect(verification.html).toContain(`${origin}/verify-email?token=synthetic-token`);
            const invite = await renderEmail('contract-request-invite', branding, {
                inviteUrl: branding.appUrl!,
            });
            expect(invite.html).toContain(`href="${origin}"`);
            expect(invite.html).not.toContain('wrong-environment.example');
        }
    );

    it('uses an explicitly configured custom tenant instead of stored branding', () => {
        mocks.environment.EMAIL_APP_ORIGINS = JSON.stringify({
            partner: 'https://partner.example',
        });
        expect(
            getEmailActionBranding('partner', { appUrl: 'https://elsewhere.example' }).appUrl
        ).toBe('https://partner.example');
    });

    it.each([
        undefined,
        '',
        '{}',
        'invalid',
        '[]',
        '{"learncard":"http://learncard.app"}',
        '{"learncard":"https://user:password@learncard.app"}',
        '{"learncard":"https://learncard.app/path"}',
        '{"learncard":"https://learncard.app?redirect=elsewhere"}',
        '{"learncard":"https://learncard.app/#fragment"}',
    ])('fails closed for missing, malformed or unsafe configuration (%s)', origins => {
        mocks.environment.EMAIL_APP_ORIGINS = origins;
        expect(() => getEmailActionBranding('learncard')).toThrow(
            'Email app origin is not configured'
        );
    });

    it('never uses another tenant or a legacy branding snapshot without tenant identity', () => {
        mocks.environment.EMAIL_APP_ORIGINS = JSON.stringify({
            learncard: 'https://staging.learncard.ai',
        });
        expect(() =>
            getEmailActionBranding('vetpass', { appUrl: 'https://vetpass.app' })
        ).toThrow();
        expect(() =>
            getEmailActionBranding(undefined, { appUrl: 'https://learncard.app' })
        ).toThrow();
    });

    it('permits HTTP loopback only when explicitly offline', () => {
        mocks.environment.EMAIL_APP_ORIGINS = JSON.stringify({
            learncard: 'http://localhost:3000',
        });
        expect(() => getEmailActionBranding('learncard')).toThrow();
        mocks.environment.IS_OFFLINE = true;
        expect(getEmailActionBranding('learncard').appUrl).toBe('http://localhost:3000');
    });
});
