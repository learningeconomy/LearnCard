import { describe, expect, it } from 'vitest';
import { shouldUpdateNotificationsWebhook } from './notificationWebhook.helpers';

const staging = 'https://staging.api.learncard.app/api/notifications/send';
const production = 'https://api.learncard.app/api/notifications/send';
const did = 'did:web:staging.network.learncard.com:users:test-recipient';

describe('notification destination repair', () => {
    it('repairs the leaked production default for a staging profile', () => {
        expect(
            shouldUpdateNotificationsWebhook({ did, notificationsWebhook: production }, staging)
        ).toBe(true);
    });

    it.each([undefined, '', '   '])('fills a missing destination (%s)', notificationsWebhook => {
        expect(shouldUpdateNotificationsWebhook({ did, notificationsWebhook }, staging)).toBe(true);
    });

    it.each([staging, 'https://custom.example/notifications', production + '?custom=true'])(
        'preserves an existing correct or custom destination (%s)',
        notificationsWebhook => {
            expect(shouldUpdateNotificationsWebhook({ did, notificationsWebhook }, staging)).toBe(
                false
            );
        }
    );

    it.each([
        undefined,
        'did:web:network.learncard.com:users:test-recipient',
        'did:web:staging.network.learncard.com.evil.test:users:test-recipient',
    ])('does not migrate other or unknown network profiles (%s)', profileDid => {
        expect(
            shouldUpdateNotificationsWebhook(
                { did: profileDid, notificationsWebhook: production },
                staging
            )
        ).toBe(false);
    });

    it.each([production, 'https://custom.example/notifications'])(
        'does not migrate when the resolved destination is not staging (%s)',
        target => {
            expect(
                shouldUpdateNotificationsWebhook({ did, notificationsWebhook: production }, target)
            ).toBe(false);
        }
    );

    it('does not update an unresolved profile', () => {
        expect(shouldUpdateNotificationsWebhook(undefined, staging)).toBe(false);
    });
});
