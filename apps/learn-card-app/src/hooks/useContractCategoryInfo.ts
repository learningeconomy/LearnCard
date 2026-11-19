import { VERIFIABLE_DATA_FIELD_PREFIX } from '@learncard/types';
import { useOptionalTenantConfig } from 'learn-card-base/config/TenantConfigProvider';
import type { TenantConfig } from 'learn-card-base/config/tenantConfig';
import { resolveProfileField } from 'learn-card-base/config/profileFields';
import User from 'learn-card-base/svgs/User';

import { getInfoFromContractKey } from '../helpers/contract.helpers';
import * as m from '../paraglide/messages.js';

/** Resolve profile scope labels while leaving ordinary credential categories to their caller. */
export const getContractProfileFieldLabel = (
    category: string,
    tenant: Pick<TenantConfig, 'tenantId' | 'verifiableDataSchemas'> | null
): string | undefined => {
    if (!category.startsWith(VERIFIABLE_DATA_FIELD_PREFIX)) return undefined;

    const field = tenant
        ? resolveProfileField(category, tenant.tenantId, tenant.verifiableDataSchemas ?? {})
        : undefined;

    return field?.label ?? m['base.profileFields.unavailable']();
};

/** Resolve display metadata without changing the category used for grants or storage. */
export const useContractCategoryInfo = (
    category: string
): ReturnType<typeof getInfoFromContractKey> => {
    const title = getContractProfileFieldLabel(category, useOptionalTenantConfig());
    if (title === undefined) return getInfoFromContractKey(category);

    return {
        IconComponent: User,
        title,
        plural: title,
        iconClassName: 'text-grayscale-700',
        iconCircleClass: 'bg-grayscale-100',
    };
};
