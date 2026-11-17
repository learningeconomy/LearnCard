import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
    INTEGRATION_WEBHOOK_DELIVERY_HEADER,
    INTEGRATION_WEBHOOK_EVENT_ID_HEADER,
    INTEGRATION_WEBHOOK_SIGNATURE_HEADER,
    buildSignatureHeader,
    signIntegrationWebhookBody,
} from './integration-webhook-signature.helpers';

const secret = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';
const timestamp = 1_763_337_600;
const body = '{"eventId":"event-1","sequence":1}';

describe('integration webhook signature', () => {
    it('signs timestamp + "." + body with HMAC-SHA256 and returns lowercase hex', () => {
        const signature = signIntegrationWebhookBody({ secret, timestamp, body });

        expect(signature).toMatch(/^[0-9a-f]{64}$/);
        expect(signature).toBe(
            createHmac('sha256', secret).update(`1763337600.${body}`, 'utf8').digest('hex')
        );
    });

    it('matches a fixed vector, so other languages can check their implementation', () => {
        expect(
            signIntegrationWebhookBody({ secret: 'whsec_test', timestamp: 1700000000, body: '{}' })
        ).toBe('35495024f4ef3f94e5a93e22221544c4b75e9a42300cd965ab81cb85cd994e91');
    });

    it('changes when the secret, the timestamp or one byte of the body changes', () => {
        const base = signIntegrationWebhookBody({ secret, timestamp, body });

        expect(signIntegrationWebhookBody({ secret: `${secret}x`, timestamp, body })).not.toBe(
            base
        );
        expect(signIntegrationWebhookBody({ secret, timestamp: timestamp + 1, body })).not.toBe(
            base
        );
        expect(signIntegrationWebhookBody({ secret, timestamp, body: `${body} ` })).not.toBe(base);
    });

    it('signs multi-byte characters as UTF-8', () => {
        const unicodeBody = '{"note":"é✓"}';

        expect(signIntegrationWebhookBody({ secret, timestamp, body: unicodeBody })).toBe(
            createHmac('sha256', secret)
                .update(Buffer.from(`${timestamp}.${unicodeBody}`, 'utf8'))
                .digest('hex')
        );
    });

    it('builds the header for one secret', () => {
        expect(buildSignatureHeader({ secrets: [secret], timestamp, body })).toBe(
            `t=1763337600,v1=${signIntegrationWebhookBody({ secret, timestamp, body })}`
        );
    });

    it('appends a second v1 value for the previous secret during rotation', () => {
        const previous = 'whsec_previous';
        const header = buildSignatureHeader({ secrets: [secret, previous], timestamp, body });

        expect(header.split(',')).toEqual([
            't=1763337600',
            `v1=${signIntegrationWebhookBody({ secret, timestamp, body })}`,
            `v1=${signIntegrationWebhookBody({ secret: previous, timestamp, body })}`,
        ]);
    });

    it('exposes the header names', () => {
        expect(INTEGRATION_WEBHOOK_SIGNATURE_HEADER).toBe('X-LearnCard-Signature');
        expect(INTEGRATION_WEBHOOK_EVENT_ID_HEADER).toBe('X-LearnCard-Event-Id');
        expect(INTEGRATION_WEBHOOK_DELIVERY_HEADER).toBe('X-LearnCard-Delivery');
    });
});
