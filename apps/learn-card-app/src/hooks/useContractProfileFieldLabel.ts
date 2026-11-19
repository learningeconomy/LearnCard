import { useCallback } from 'react';
import { VERIFIABLE_DATA_FIELD_PREFIX } from '@learncard/types';
import { useOptionalTenantConfig } from 'learn-card-base/config/TenantConfigProvider';
import type { TenantConfig } from 'learn-card-base/config/tenantConfig';
import { resolveProfileField } from 'learn-card-base/config/profileFields';

import * as m from '../paraglide/messages.js';

/** Resolve profile scope labels while leaving ordinary credential categories to their caller. */
const getContractProfileFieldLabel = (
    category: string,
    tenant: Pick<TenantConfig, 'tenantId' | 'verifiableDataSchemas'> | null
): string | undefined => {
    if (!category.startsWith(VERIFIABLE_DATA_FIELD_PREFIX)) return undefined;

    const field = tenant
        ? resolveProfileField(category, tenant.tenantId, tenant.verifiableDataSchemas ?? {})
        : undefined;

    return field?.label ?? m['base.profileFields.unavailable']();
};

/** Resolve labels for a list of contract categories in the active tenant. */
export const useContractProfileFieldLabel = (): ((category: string) => string | undefined) => {
    const tenant = useOptionalTenantConfig();
    return useCallback(
        (category: string) => getContractProfileFieldLabel(category, tenant),
        [tenant]
    );
};
