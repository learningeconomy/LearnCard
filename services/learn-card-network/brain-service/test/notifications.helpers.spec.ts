import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    parseNotificationWebhookResponse,
    resolveNotificationWebhookUrl,
} from '@helpers/notifications.helpers';

describe('parseNotificationWebhookResponse', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('accepts a boolean success response', () => {
        expect(parseNotificationWebhookResponse(true, true)).toBe(true);
    });

    it('accepts wrapped local success payloads', () => {
        expect(
            parseNotificationWebhookResponse(
                {
                    result: {
                        data: {
                            sent: true,
                        },
                    },
                },
                true
            )
        ).toBe(true);

        expect(
            parseNotificationWebhookResponse(
                {
                    data: {
                        success: true,
                    },
                },
                true
            )
        ).toBe(true);
    });

    it('falls back to HTTP success when the payload is unexpected', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        expect(parseNotificationWebhookResponse({ status: 'ok' }, true)).toBe(true);
        expect(warnSpy).toHaveBeenCalledOnce();
    });

    it.each([{ sent: false }, { success: false }, { ok: false }])(
        'returns false for explicit negative webhook flags: %j',
        payload => {
            expect(parseNotificationWebhookResponse(payload, true)).toBe(false);
        }
    );

    it('returns false for an unexpected payload when the HTTP response is not ok', () => {
        expect(parseNotificationWebhookResponse({ status: 'ok' }, false)).toBe(false);
    });

    it('prefers the local notifications service in offline mode when profile webhooks are stale remote URLs', () => {
        const originalIsOffline = process.env.IS_OFFLINE;
        const originalNotificationsServiceWebhookUrl =
            process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL;

        process.env.IS_OFFLINE = 'true';
        process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL =
            'https://api.scoutnetwork.org/api/notifications/send';

        expect(
            resolveNotificationWebhookUrl({
                type: 'BOOST_RECEIVED',
                to: {
                    did: 'did:web:localhost%3A4000:users:userb',
                    profileId: 'userb',
                    notificationsWebhook: 'https://api.learncard.app/api/notifications/send',
                },
                from: 'did:web:localhost%3A4000:users:usera',
                message: { title: 'Boost Received', body: 'You have a new boost.' },
                data: { vcUris: ['lc:network:localhost%3A4000/trpc:credential:123'] },
            } as any)
        ).toBe('http://localhost:5100/api/notifications/send');

        process.env.IS_OFFLINE = originalIsOffline;
        process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL = originalNotificationsServiceWebhookUrl;
    });
});
