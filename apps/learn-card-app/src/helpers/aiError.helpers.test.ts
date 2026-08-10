import { describe, expect, it, vi } from 'vitest';

vi.mock('../paraglide/messages.js', () => ({
    'ai.errors.quotaTitle': () => 'Quota title',
    'ai.errors.quotaBody': () => 'Quota body',
    'ai.errors.rateTitle': () => 'Rate title',
    'ai.errors.rateBody': () => 'Rate body',
    'ai.errors.unavailableTitle': () => 'Unavailable title',
    'ai.errors.unavailableBody': () => 'Unavailable body',
    'ai.errors.timeoutTitle': () => 'Timeout title',
    'ai.errors.timeoutBody': () => 'Timeout body',
    'ai.errors.unknownTitle': () => 'Unknown title',
    'ai.errors.unknownBody': () => 'Unknown body',
}));

import { getAiErrorCopy } from './aiError.helpers';

describe('getAiErrorCopy', () => {
    it.each([
        ['ai_provider_quota_exhausted', 'Quota title', 'Quota body'],
        ['ai_provider_rate_limited', 'Rate title', 'Rate body'],
        ['ai_provider_unavailable', 'Unavailable title', 'Unavailable body'],
        ['ai_request_timeout', 'Timeout title', 'Timeout body'],
        ['ai_provider_invalid_response', 'Unknown title', 'Unknown body'],
    ] as const)('maps %s to localized copy', (code, title, body) => {
        expect(getAiErrorCopy(code)).toEqual({ title, body });
    });
});
