import { z } from 'zod';

export const TenantNodeValidator = z.object({
    tenantId: z.string(),
    rootEcosystemId: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type TenantNodeType = z.infer<typeof TenantNodeValidator>;
