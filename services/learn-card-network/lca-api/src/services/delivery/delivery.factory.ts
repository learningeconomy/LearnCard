/**
 * Delivery Factory
 *
 * Environment-driven factory that resolves the correct DeliveryService adapter.
 *
 * Resolution order:
 *   1. Test / CI environments → LogAdapter (always)
 *   2. POSTMARK_SERVER_TOKEN present → PostmarkAdapter
 *   3. Fallback → LogAdapter
 *
 * Environment Variables:
 *   POSTMARK_SERVER_TOKEN  — Postmark API key
 *   POSTMARK_FROM_EMAIL    — Default "From" address (required for Postmark)
 */

import { DeliveryService } from './delivery.service';
import { LogAdapter } from './adapters/log.adapter';
import { PostmarkAdapter } from './adapters/postmark.adapter';

const IS_TEST_ENVIRONMENT = process.env.NODE_ENV === 'test';

let cachedService: DeliveryService | null = null;

export const getDeliveryService = (): DeliveryService => {
    if (cachedService) return cachedService;

    if (IS_TEST_ENVIRONMENT || process.env.IS_CI || process.env.IS_E2E_TEST) {
        console.log('[delivery] Test environment detected. Using LogAdapter.');
        cachedService = new LogAdapter();
        return cachedService;
    }

    const { POSTMARK_SERVER_TOKEN, POSTMARK_FROM_EMAIL } = process.env;

    if (POSTMARK_SERVER_TOKEN && POSTMARK_FROM_EMAIL) {
        console.log('[delivery] Postmark credentials found. Using PostmarkAdapter.');
        cachedService = new PostmarkAdapter(POSTMARK_SERVER_TOKEN, POSTMARK_FROM_EMAIL);
        return cachedService;
    }

    console.log('[delivery] No email provider configured. Using LogAdapter.');
    cachedService = new LogAdapter();
    return cachedService;
};
