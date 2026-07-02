import { Tenant } from '@models';
import { Ecosystem as EcosystemType } from '@learncard/types';
import { TenantNodeType } from 'types/tenant';
import { getEcosystemById } from '@accesslayer/ecosystem/read';

export const getTenantById = async (tenantId: string): Promise<TenantNodeType | null> => {
    return Tenant.findOne({ where: { tenantId }, plain: true });
};

export const getTenantRootEcosystem = async (tenantId: string): Promise<EcosystemType | null> => {
    const tenant = await getTenantById(tenantId);

    if (!tenant?.rootEcosystemId) return null;

    return getEcosystemById(tenant.rootEcosystemId);
};
