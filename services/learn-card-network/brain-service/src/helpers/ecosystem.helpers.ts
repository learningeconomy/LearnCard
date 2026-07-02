export type TenantEcosystemBinding = {
    ecosystemId?: string;
    rootOrgId?: string;
};

// ADR-001 §7 fallback resolution. Wired into Phase 4 write-path routes (none exist in Phase 1).
export const resolveEcosystemId = (
    explicitEcosystemId: string | undefined,
    tenantEcosystem: TenantEcosystemBinding | undefined
): string | undefined => {
    return explicitEcosystemId ?? tenantEcosystem?.ecosystemId;
};
