import { createHmac } from 'node:crypto';

export const INTEGRATION_WEBHOOK_SIGNATURE_HEADER = 'X-LearnCard-Signature';
export const INTEGRATION_WEBHOOK_EVENT_ID_HEADER = 'X-LearnCard-Event-Id';
export const INTEGRATION_WEBHOOK_DELIVERY_HEADER = 'X-LearnCard-Delivery';

/**
 * Hex HMAC-SHA256 of `${timestamp}.${body}`.
 * The key is the whole secret string (including its `whsec_` prefix) as UTF-8 bytes.
 * `timestamp` is Unix time in seconds. `body` must be the exact string that is sent.
 */
export const signIntegrationWebhookBody = ({
    secret,
    timestamp,
    body,
}: {
    secret: string;
    timestamp: number;
    body: string;
}): string => createHmac('sha256', secret).update(`${timestamp}.${body}`, 'utf8').digest('hex');

/**
 * Value of the X-LearnCard-Signature header: `t=<unix seconds>,v1=<hex>`.
 * During a secret rotation a second `v1=` value is appended for the previous secret.
 */
export const buildSignatureHeader = ({
    secrets,
    timestamp,
    body,
}: {
    secrets: string[];
    timestamp: number;
    body: string;
}): string =>
    [
        `t=${timestamp}`,
        ...secrets.map(secret => `v1=${signIntegrationWebhookBody({ secret, timestamp, body })}`),
    ].join(',');
