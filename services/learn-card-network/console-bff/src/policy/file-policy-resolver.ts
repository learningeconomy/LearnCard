import { readFileSync } from 'fs';

import { TenantAuthPolicyValidator, type TenantAuthPolicy } from '@learncard/types';

export function createFilePolicyResolver(
    path: string
): (tenantId: string) => Promise<TenantAuthPolicy> {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown[];
    const policies = new Map<string, TenantAuthPolicy>();

    for (const entry of parsed) {
        const policy = TenantAuthPolicyValidator.parse(entry);
        policies.set(policy.tenantId, policy);
    }

    return async (tenantId: string) => {
        const policy = policies.get(tenantId);

        if (!policy) throw new Error(`No auth policy configured for tenant "${tenantId}"`);

        return policy;
    };
}
