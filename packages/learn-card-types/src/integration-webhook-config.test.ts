import { describe, expect, it } from 'vitest';

import {
    IntegrationWebhookRegistrationValidator,
    IntegrationWebhookUrlValidator,
    LCNIntegrationUpdateValidator,
    LCNIntegrationValidator,
} from './lcn';

const baseIntegration = {
    id: 'integration-1',
    name: 'Example',
    publishableKey: 'pk_123',
    whitelistedDomains: [],
    status: 'setup',
};

describe('LCNIntegrationValidator webhook fields', () => {
    it('keeps the three public webhook fields', () => {
        const parsed = LCNIntegrationValidator.parse({
            ...baseIntegration,
            webhookUrl: 'https://hooks.example.com/learncard',
            hasWebhookSecret: true,
            contractEventsEnabledAt: '2026-11-14T00:00:00.000Z',
        });

        expect(parsed.webhookUrl).toBe('https://hooks.example.com/learncard');
        expect(parsed.hasWebhookSecret).toBe(true);
        expect(parsed.contractEventsEnabledAt).toBe('2026-11-14T00:00:00.000Z');
    });

    it('still accepts an integration with no webhook fields', () => {
        const parsed = LCNIntegrationValidator.parse(baseIntegration);

        expect(parsed).not.toHaveProperty('webhookUrl');
        expect(parsed).not.toHaveProperty('contractEventsEnabledAt');
    });

    it('strips encrypted secrets and sequence bookkeeping', () => {
        const parsed = LCNIntegrationValidator.parse({
            ...baseIntegration,
            webhookSecretEnc: 'lc-whsec-jwe:v1:{}',
            webhookSecretPrevEnc: 'lc-whsec-jwe:v1:{}',
            webhookSecretPrevExpiresAt: '2026-11-15T00:00:00.000Z',
            eventSeq: 7,
            eventPurgedThroughSeq: 3,
            eventSeqLock: 9,
        });

        expect(parsed).not.toHaveProperty('webhookSecretEnc');
        expect(parsed).not.toHaveProperty('webhookSecretPrevEnc');
        expect(parsed).not.toHaveProperty('webhookSecretPrevExpiresAt');
        expect(parsed).not.toHaveProperty('eventSeq');
        expect(parsed).not.toHaveProperty('eventPurgedThroughSeq');
        expect(parsed).not.toHaveProperty('eventSeqLock');
    });
});

describe('IntegrationWebhookUrlValidator', () => {
    it.each(['http://example.com/hook', 'https://example.com/hook', 'http://localhost:3000/hook'])(
        'accepts %j',
        webhookUrl => {
            expect(IntegrationWebhookUrlValidator.parse(webhookUrl)).toBe(webhookUrl);
        }
    );

    it.each([
        'httpx://example.com/hook',
        'httpss://example.com/hook',
        'ftp://example.com/hook',
        'ws://example.com/hook',
        'http:example.com/hook',
        'http://',
        'https://',
        'javascript:alert(1)',
        'not a url',
        '',
    ])('rejects %j', webhookUrl => {
        expect(IntegrationWebhookUrlValidator.safeParse(webhookUrl).success).toBe(false);
    });

    it('rejects a URL longer than 2048 characters', () => {
        expect(
            IntegrationWebhookUrlValidator.safeParse(`https://example.com/${'a'.repeat(2048)}`)
                .success
        ).toBe(false);
        expect(
            IntegrationWebhookUrlValidator.safeParse(`https://example.com/${'a'.repeat(2028)}`)
                .success
        ).toBe(true);
    });
});

describe('LCNIntegrationUpdateValidator webhook fields', () => {
    it('does not accept a webhook URL: it is set with setIntegrationWebhook', () => {
        expect(
            LCNIntegrationUpdateValidator.parse({ webhookUrl: 'https://hooks.example.com/a' })
        ).not.toHaveProperty('webhookUrl');
    });

    it('accepts contractEventsEnabled as a boolean only', () => {
        expect(
            LCNIntegrationUpdateValidator.parse({ contractEventsEnabled: true })
                .contractEventsEnabled
        ).toBe(true);
        expect(
            LCNIntegrationUpdateValidator.safeParse({ contractEventsEnabled: 'yes' }).success
        ).toBe(false);
    });

    it('does not accept a secret', () => {
        const parsed = LCNIntegrationUpdateValidator.parse({
            webhookSecret: 'whsec_abc',
            webhookSecretEnc: 'x',
        });

        expect(parsed).not.toHaveProperty('webhookSecret');
        expect(parsed).not.toHaveProperty('webhookSecretEnc');
    });
});

describe('IntegrationWebhookRegistrationValidator', () => {
    it('carries the secret only when one is given', () => {
        expect(
            IntegrationWebhookRegistrationValidator.parse({
                webhookUrl: 'https://hooks.example.com/a',
                secret: 'whsec_abc',
                contractEventsEnabledAt: '2026-01-01T00:00:00.000Z',
            })
        ).toEqual({
            webhookUrl: 'https://hooks.example.com/a',
            secret: 'whsec_abc',
            contractEventsEnabledAt: '2026-01-01T00:00:00.000Z',
        });
        expect(IntegrationWebhookRegistrationValidator.parse({ webhookUrl: null })).toEqual({
            webhookUrl: null,
        });
    });

    it('requires webhookUrl to be a string or null', () => {
        expect(IntegrationWebhookRegistrationValidator.safeParse({}).success).toBe(false);
    });
});
