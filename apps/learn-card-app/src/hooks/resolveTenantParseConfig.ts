import { getResolvedTenantConfig } from '../config/bootstrapTenantConfig';
import type { ParseClaimInputConfig } from './parseClaimInput';

/**
 * Single source of truth for translating the resolved tenant config
 * into a `ParseClaimInputConfig`. Used by both the OS-level deep-link
 * listener (`AppUrlListener`) and the in-app router
 * (`useClaimInputRouter`) so they always agree on which schemes /
 * HTTPS domains are accepted for the active tenant.
 *
 * Passes `undefined` (not a hardcoded fallback) when the tenant
 * config omits a field — that surrenders the choice to
 * `parseClaimInput`'s `DEFAULT_*` constants, which is the only place
 * the defaults are encoded.
 */
export const resolveTenantParseConfig = (): ParseClaimInputConfig => {
    const tenant = getResolvedTenantConfig();
    const nativeConfig = tenant.native;
    return {
        customSchemes: nativeConfig?.customSchemes,
        httpsDomains: nativeConfig?.deepLinkDomains,
    };
};
