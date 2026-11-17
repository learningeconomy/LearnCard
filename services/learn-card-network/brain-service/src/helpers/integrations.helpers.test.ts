import { describe, expect, it } from 'vitest';

import type { IntegrationType } from 'types/integration';

import { deriveIntegrationWebhookState, parseIntegration } from './integrations.helpers';

const base = {
    id: 'integration-1',
    name: 'Example',
    publishableKey: 'pk_123',
    whitelistedDomains: [],
    status: 'setup',
};

const asStored = (extra: Record<string, unknown>): IntegrationType =>
    ({ ...base, ...extra }) as unknown as IntegrationType;

describe('parseIntegration', () => {
    it('removes encrypted secrets, sequence bookkeeping and delivery health', () => {
        const parsed = parseIntegration(
            asStored({
                webhookUrl: 'https://hooks.example.com/a',
                contractEventsEnabledAt: '2026-11-14T00:00:00.000Z',
                webhookSecretEnc: 'lc-whsec-jwe:v1:{}',
                webhookSecretPrevEnc: 'lc-whsec-jwe:v1:{}',
                webhookSecretPrevExpiresAt: '2026-11-15T00:00:00.000Z',
                webhookSecretVersion: 2,
                webhookLastSuccessAt: '2026-11-14T01:00:00.000Z',
                webhookLastFailureAt: '2026-11-14T02:00:00.000Z',
                webhookLastFailureReason: 'http_500',
                eventSeq: 7,
                eventPurgedThroughSeq: 3,
                eventSeqLock: 9,
            })
        );

        expect(parsed).toEqual({
            ...base,
            webhookUrl: 'https://hooks.example.com/a',
            contractEventsEnabledAt: '2026-11-14T00:00:00.000Z',
            hasWebhookSecret: true,
        });
    });

    it('reports hasWebhookSecret false when no secret is stored', () => {
        expect(parseIntegration(asStored({}))).toEqual({ ...base, hasWebhookSecret: false });
    });

    it('ignores a hasWebhookSecret value that was stored on the node', () => {
        expect(parseIntegration(asStored({ hasWebhookSecret: true })).hasWebhookSecret).toBe(false);
    });

    it('still parses guideState from a JSON string', () => {
        const parsed = parseIntegration(
            asStored({ guideState: '{"step":2}', webhookSecretEnc: 'lc-whsec-jwe:v1:{}' })
        );

        expect(parsed.guideState).toEqual({ step: 2 });
        expect(parsed.hasWebhookSecret).toBe(true);
        expect(parsed).not.toHaveProperty('webhookSecretEnc');
    });

    it('keeps an unparseable guideState string as it is', () => {
        const parsed = parseIntegration(asStored({ guideState: '{not json' }));

        expect(parsed.guideState).toBe('{not json');
    });
});

describe('deriveIntegrationWebhookState', () => {
    const enabled = {
        webhookUrl: 'https://hooks.example.com/a',
        contractEventsEnabledAt: '2026-11-14T00:00:00.000Z',
    };

    it('is disabled without a URL or while contract events are disabled', () => {
        expect(deriveIntegrationWebhookState({ ...enabled, webhookUrl: null })).toBe('disabled');
        expect(
            deriveIntegrationWebhookState({
                webhookUrl: enabled.webhookUrl,
                lastFailureAt: '2026-11-14T02:00:00.000Z',
            })
        ).toBe('disabled');
    });

    it('is active before any attempt and after a success', () => {
        expect(deriveIntegrationWebhookState(enabled)).toBe('active');
        expect(
            deriveIntegrationWebhookState({ ...enabled, lastSuccessAt: '2026-11-14T01:00:00.000Z' })
        ).toBe('active');
    });

    it('is failing when the latest attempt failed', () => {
        expect(
            deriveIntegrationWebhookState({ ...enabled, lastFailureAt: '2026-11-14T02:00:00.000Z' })
        ).toBe('failing');
        expect(
            deriveIntegrationWebhookState({
                ...enabled,
                lastSuccessAt: '2026-11-14T01:00:00.000Z',
                lastFailureAt: '2026-11-14T02:00:00.000Z',
            })
        ).toBe('failing');
    });

    it('is active again when a success follows the failure', () => {
        expect(
            deriveIntegrationWebhookState({
                ...enabled,
                lastSuccessAt: '2026-11-14T03:00:00.000Z',
                lastFailureAt: '2026-11-14T02:00:00.000Z',
            })
        ).toBe('active');
    });
});
