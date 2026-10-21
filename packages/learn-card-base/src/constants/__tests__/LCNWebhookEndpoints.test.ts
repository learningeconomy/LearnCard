import { beforeEach, describe, expect, it } from 'vitest';

import { getNotificationsEndpoint } from '../LCNWebhookEndpoints';
import baseConfig from '../../../../../apps/learn-card-app/environments/learncard/config.json';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../../config/tenantDefaults';
import stagingConfig from '../../../../../apps/learn-card-app/environments/learncard/config.staging.json';
import { deepMerge } from '../../config/deepMerge';
import { parseTenantConfig } from '../../config/tenantConfigSchema';
import { initNetworkStoreFromTenant } from '../../stores/NetworkStore';
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

// Use the shipped JSON and the same overlay merge used at runtime. Staging must
// explicitly replace the production endpoint inherited from the baked config.
describe('LearnCard staging notification configuration', () => {
    it('routes new profiles to staging after applying the overlay to the production bake', () => {
        const bakedConfig = deepMerge(
            DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
            baseConfig
        );
        const config = parseTenantConfig(
            deepMerge(bakedConfig, stagingConfig),
            'staging routing regression'
        );
        initNetworkStoreFromTenant(config.apis, config.tenantId);
        expect(getNotificationsEndpoint()).toBe(
            'https://staging.api.learncard.app/api/notifications/send'
        );
    });
});
