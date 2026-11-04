import { describe, expect, it } from 'vitest';

import baseConfig from '../../../../../apps/learn-card-app/environments/learncard/config.json';
import stagingConfig from '../../../../../apps/learn-card-app/environments/learncard/config.staging.json';
import keycloakStagingConfig from '../../../../../apps/learn-card-app/environments/learncard/config.keycloak-staging.json';
import { deepMerge } from '../deepMerge';
import { parseTenantConfig } from '../tenantConfigSchema';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../tenantDefaults';
import { initNetworkStoreFromTenant, networkStore } from '../../stores/NetworkStore';

const PROD_AIP = 'https://api.learncloud.ai';
const STAGING_AIP = 'https://staging-lca-backend.fly.dev';

const aiServiceFor = (overlay?: Record<string, unknown>): string => {
    const merged = overlay ? deepMerge(baseConfig, overlay) : baseConfig;
    initNetworkStoreFromTenant(
        parseTenantConfig(merged, 'learncard stage overlay').apis,
        'learncard'
    );
    return networkStore.get.aiServiceUrl();
};

describe('LearnCard aiService per stage', () => {
    it('keeps production on the production AI Passport', () => {
        expect(aiServiceFor()).toBe(PROD_AIP);
        expect(DEFAULT_LEARNCARD_TENANT_CONFIG.apis.aiService).toBe(PROD_AIP);
    });

    it('points the staging overlay at the staging AI Passport', () => {
        expect(aiServiceFor(stagingConfig)).toBe(STAGING_AIP);
    });

    it('points the keycloak-staging overlay at the staging AI Passport', () => {
        expect(aiServiceFor(keycloakStagingConfig)).toBe(STAGING_AIP);
    });
});
