import { beforeEach, describe, expect, it } from 'vitest';

import { getNotificationsEndpoint } from '../LCNWebhookEndpoints';
import { networkStore } from '../../stores/NetworkStore';

describe('getNotificationsEndpoint', () => {
    beforeEach(() => {
        networkStore.set.apiEndpoint('https://api.learncard.app/trpc');
        networkStore.set.notificationsEndpoint('');
        networkStore.set.tenantId('');
    });

    it('returns the LearnCard notifications endpoint by default', () => {
        expect(getNotificationsEndpoint()).toBe('https://api.learncard.app/api/notifications/send');
    });

    it('returns the staging ScoutPass notifications endpoint for the scoutpass tenant', () => {
        networkStore.set.tenantId('scoutpass');
        networkStore.set.apiEndpoint('https://staging.api.scoutnetwork.org/trpc');

        expect(getNotificationsEndpoint()).toBe(
            'https://staging.api.scoutnetwork.org/api/notifications/send'
        );
    });

    it('returns the tenant notifications endpoint before deriving from APIs', () => {
        networkStore.set.tenantId('scoutpass');
        networkStore.set.apiEndpoint('https://api.scoutnetwork.org/trpc');
        networkStore.set.notificationsEndpoint(
            'https://staging.api.scoutnetwork.org/api/notifications/send'
        );

        expect(getNotificationsEndpoint()).toBe(
            'https://staging.api.scoutnetwork.org/api/notifications/send'
        );
    });

    it('returns the ScoutPass notifications endpoint for scoutnetwork URLs before LCA fallback', () => {
        networkStore.set.apiEndpoint('https://staging.api.scoutnetwork.org/trpc');

        expect(getNotificationsEndpoint()).toBe(
            'https://staging.api.scoutnetwork.org/api/notifications/send'
        );
    });

    it('does not treat scoutnetwork.org substrings in other hostnames as ScoutPass', () => {
        networkStore.set.apiEndpoint('https://scoutnetwork.org.evil.test/trpc');

        expect(getNotificationsEndpoint()).toBe(
            'https://scoutnetwork.org.evil.test/api/notifications/send'
        );
    });
});
