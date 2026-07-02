export type TenantEcosystemBinding = {
    ecosystemId?: string;
    rootOrgId?: string;
};

export const resolveEcosystemId = (
    explicitEcosystemId: string | undefined,
    tenantEcosystem: TenantEcosystemBinding | undefined
): string | undefined => {
    return explicitEcosystemId ?? tenantEcosystem?.ecosystemId;
};
