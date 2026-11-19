import { VERIFIABLE_DATA_FIELD_PREFIX } from '@learncard/types';
import { useOptionalTenantConfig } from 'learn-card-base/config/TenantConfigProvider';
import { resolveProfileField } from 'learn-card-base/config/profileFields';
import User from 'learn-card-base/svgs/User';

import { getInfoFromContractKey } from '../helpers/contract.helpers';
import * as m from '../paraglide/messages.js';

/** Resolve display metadata without changing the category used for grants or storage. */
export const useContractCategoryInfo = (
    category: string
): ReturnType<typeof getInfoFromContractKey> => {
    const tenant = useOptionalTenantConfig();
    if (!category.startsWith(VERIFIABLE_DATA_FIELD_PREFIX)) return getInfoFromContractKey(category);

    const field = tenant
        ? resolveProfileField(category, tenant.tenantId, tenant.verifiableDataSchemas ?? {})
        : undefined;
    const title = field?.label ?? m['base.profileFields.unavailable']();

    return {
        IconComponent: User,
        title,
        plural: title,
        iconClassName: 'text-grayscale-700',
        iconCircleClass: 'bg-grayscale-100',
    };
};
