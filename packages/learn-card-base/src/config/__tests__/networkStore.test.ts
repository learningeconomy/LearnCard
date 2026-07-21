import { describe, it, expect, beforeEach } from 'vitest';

import { networkStore, initNetworkStoreFromTenant } from '../../stores/NetworkStore';
import type { TenantApiConfig } from '../tenantConfig';

describe('initNetworkStoreFromTenant', () => {
    const testApis: TenantApiConfig = {
        brainService: 'https://brain.test.com/trpc',
        brainServiceApi: 'https://brain.test.com/api',
        cloudService: 'https://cloud.test.com/trpc',
        lcaApi: 'https://api.test.com/trpc',
        xapi: 'https://cloud.test.com/xapi',
        aiService: 'https://ai.test.com',
    };

    beforeEach(() => {
        // Reset to defaults
        networkStore.set.networkUrl('https://network.learncard.com/trpc');
        networkStore.set.networkApiUrl('https://network.learncard.com/api');
        networkStore.set.cloudUrl('https://cloud.learncard.com/trpc');
        networkStore.set.xapiUrl('');
        networkStore.set.apiEndpoint('https://api.learncard.app/trpc');
        networkStore.set.notificationsEndpoint('https://api.learncard.app/api/notifications/send');
        networkStore.set.aiServiceUrl('https://api.learncloud.ai');
        networkStore.set.tenantId('');
    });

    it('populates all store fields from tenant API config', () => {
        initNetworkStoreFromTenant(testApis);

        expect(networkStore.get.networkUrl()).toBe('https://brain.test.com/trpc');
        expect(networkStore.get.networkApiUrl()).toBe('https://brain.test.com/api');
        expect(networkStore.get.cloudUrl()).toBe('https://cloud.test.com/trpc');
        expect(networkStore.get.xapiUrl()).toBe('https://cloud.test.com/xapi');
        expect(networkStore.get.apiEndpoint()).toBe('https://api.test.com/trpc');
        expect(networkStore.get.notificationsEndpoint()).toBe(
            'https://api.test.com/api/notifications/send'
        );
        expect(networkStore.get.aiServiceUrl()).toBe('https://ai.test.com');
    });

    it('derives xapi URL from cloudService when xapi is not provided', () => {
        const apisNoXapi: TenantApiConfig = {
            brainService: 'https://brain.test.com/trpc',
            brainServiceApi: 'https://brain.test.com/api',
            cloudService: 'https://cloud.test.com/trpc',
            lcaApi: 'https://api.test.com/trpc',
        };

        initNetworkStoreFromTenant(apisNoXapi);

        expect(networkStore.get.xapiUrl()).toBe('https://cloud.test.com/xapi');
    });

    it('falls back to default AI service URL when aiService is not provided', () => {
        const apisNoAi: TenantApiConfig = {
            brainService: 'https://brain.test.com/trpc',
            brainServiceApi: 'https://brain.test.com/api',
            cloudService: 'https://cloud.test.com/trpc',
            lcaApi: 'https://api.test.com/trpc',
        };

        initNetworkStoreFromTenant(apisNoAi);

        expect(networkStore.get.aiServiceUrl()).toBe('https://api.learncloud.ai');
    });

    it('uses explicit tenant notifications endpoint when provided', () => {
        initNetworkStoreFromTenant({
            ...testApis,
            notificationsEndpoint: 'https://notifications.test.com/send',
        });

        expect(networkStore.get.notificationsEndpoint()).toBe(
            'https://notifications.test.com/send'
        );
    });
});
