import { describe, expect, it } from 'vitest';

import {
    IntegrationEventRoleValidator,
    IntegrationEventTypeValidator,
    IntegrationEventValidator,
    IntegrationEventsResponseValidator,
    IntegrationTestEventResultValidator,
    IntegrationWebhookSecretRotationValidator,
} from './lcn';

const fullEvent = {
    eventId: 'event-1',
    deliveryKey: 'event-1:integration-1',
    sequence: 42,
    type: 'consent_created',
    contractUri: 'lc:network:example.com/trpc/contract:abc',
    termsUri: 'lc:network:example.com/trpc/terms:def',
    subject: {
        profileId: 'veteran',
        did: 'did:web:example.com:users:veteran',
        didKey: 'did:key:z6Mk',
    },
    requestId: 'request-1',
    externalReferenceId: 'case-9',
    reason: 'contract_retired',
    role: 'recipient',
    occurredAt: '2026-11-14T00:00:00.000Z',
};

describe('IntegrationEventTypeValidator', () => {
    it('lists exactly the fifteen event types', () => {
        expect(IntegrationEventTypeValidator.options).toEqual([
            'request_sent',
            'request_accepted',
            'request_denied',
            'request_cancelled',
            'request_expired',
            'referral_attached',
            'consent_created',
            'consent_updated',
            'consent_withdrawn',
            'credentials_synced',
            'contract_retired',
            'consent_paused',
            'consent_suspended',
            'consent_expired',
            'integration.test',
        ]);
    });

    it('rejects the internal contract_updated kind', () => {
        expect(IntegrationEventTypeValidator.safeParse('contract_updated').success).toBe(false);
    });
});

describe('IntegrationEventValidator', () => {
    it('accepts a full record', () => {
        expect(IntegrationEventValidator.parse(fullEvent)).toEqual(fullEvent);
    });

    it('accepts a record with only the required fields', () => {
        const minimal = {
            eventId: 'event-2',
            deliveryKey: 'event-2:integration-1',
            sequence: 1,
            type: 'contract_retired',
            contractUri: 'lc:network:example.com/trpc/contract:abc',
            role: 'owner',
            occurredAt: '2026-11-14T00:00:00.000Z',
        };

        expect(IntegrationEventValidator.parse(minimal)).toEqual(minimal);
    });

    it('strips fields that are not part of the record', () => {
        const parsed = IntegrationEventValidator.parse({
            ...fullEvent,
            message: 'private note',
            deliveryState: 'pending',
        });

        expect(parsed).not.toHaveProperty('message');
        expect(parsed).not.toHaveProperty('deliveryState');
    });

    it('rejects a fractional or negative sequence', () => {
        expect(IntegrationEventValidator.safeParse({ ...fullEvent, sequence: 1.5 }).success).toBe(
            false
        );
        expect(IntegrationEventValidator.safeParse({ ...fullEvent, sequence: -1 }).success).toBe(
            false
        );
    });

    it('accepts the four roles and rejects target', () => {
        expect(IntegrationEventRoleValidator.options).toEqual([
            'owner',
            'writer',
            'recipient',
            'requester',
        ]);
        expect(IntegrationEventValidator.safeParse({ ...fullEvent, role: 'target' }).success).toBe(
            false
        );
    });
});

describe('IntegrationEventsResponseValidator', () => {
    it('requires latestCursor and allows a missing cursor', () => {
        expect(
            IntegrationEventsResponseValidator.parse({
                records: [],
                latestCursor: 'MA',
                hasMore: false,
            })
        ).toEqual({ records: [], latestCursor: 'MA', hasMore: false });

        expect(
            IntegrationEventsResponseValidator.safeParse({ records: [], hasMore: false }).success
        ).toBe(false);
    });
});

describe('webhook route result validators', () => {
    it('validates a secret rotation result', () => {
        expect(IntegrationWebhookSecretRotationValidator.parse({ secret: 'whsec_abc' })).toEqual({
            secret: 'whsec_abc',
        });
        expect(
            IntegrationWebhookSecretRotationValidator.parse({
                secret: 'whsec_abc',
                previousSecretExpiresAt: '2026-11-15T00:00:00.000Z',
            }).previousSecretExpiresAt
        ).toBe('2026-11-15T00:00:00.000Z');
    });

    it('validates a test event result', () => {
        expect(
            IntegrationTestEventResultValidator.parse({
                delivered: true,
                httpStatus: 200,
                latencyMs: 42,
            })
        ).toEqual({ delivered: true, httpStatus: 200, latencyMs: 42 });
        expect(
            IntegrationTestEventResultValidator.parse({ delivered: false, error: 'timeout' })
        ).toEqual({ delivered: false, error: 'timeout' });
    });
});
