import { Tenant } from '@models';
import { Ecosystem as EcosystemType } from '@learncard/types';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { getEcosystemById, inflateEcosystem } from '@accesslayer/ecosystem/read';
import { getTenantById } from '@accesslayer/tenant/read';
import { FlatEcosystemType } from 'types/ecosystem';

export const slugifyTenantId = (tenantId: string): string => {
    const slug = tenantId
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 64);

    return slug || 'tenant';
};

export type EnsureShadowRootInput = {
    tenantId: string;
    ownerProfileId: string;
    name?: string;
    slug?: string;
};

export const ensureShadowRootEcosystem = async (
    input: EnsureShadowRootInput
): Promise<EcosystemType> => {
    const { tenantId, ownerProfileId, name, slug } = input;

    const existing = await getTenantById(tenantId);

    if (existing?.rootEcosystemId) {
        const rootEcosystem = await getEcosystemById(existing.rootEcosystemId);
        if (rootEcosystem) return rootEcosystem;
    }

    const root = await createEcosystem({
        name: name ?? tenantId,
        slug: slug ?? slugifyTenantId(tenantId),
        description: undefined,
        parentEcosystemId: null,
        ownerProfileId,
        settings: {},
        status: 'ACTIVE',
    });

    const now = new Date().toISOString();
    const tenantInstance = await Tenant.findOne({ where: { tenantId } });

    if (tenantInstance) {
        tenantInstance.rootEcosystemId = root.id;
        tenantInstance.updatedAt = now;
        await tenantInstance.save();
    } else {
        await Tenant.createOne({
            tenantId,
            rootEcosystemId: root.id,
            createdAt: now,
            updatedAt: now,
        });
    }

    const owner = await Tenant.findOne({ where: { tenantId } });
    if (owner) await owner.relateTo({ alias: 'serves', where: { id: root.id } });

    return inflateEcosystem(root.dataValues as FlatEcosystemType);
};
