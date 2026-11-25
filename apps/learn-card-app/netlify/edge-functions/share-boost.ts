import type { Config } from '@netlify/edge-functions';
import { resolveTenantConfig, getTenantOrigin } from './shared/tenant-resolver.ts';
import { createShareBoostHandler } from './shared/share-boost-handler.ts';

export const config: Config = { path: '/share-boost' };

export default createShareBoostHandler({
    resolveTenantConfig,
    getTenantOrigin,
    fetch,
});
