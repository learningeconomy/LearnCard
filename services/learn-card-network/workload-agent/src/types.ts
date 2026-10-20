import { z } from 'zod';
export const operationSchema = z.object({
    operationId: z.string(),
    deploymentId: z.string(),
    action: z.enum(['APPLY', 'UPGRADE', 'RETIRE']),
    specRevision: z.number().int().nonnegative(),
    status: z.enum(['QUEUED', 'CLAIMED', 'SUCCEEDED', 'FAILED']),
    leaseToken: z.string().optional(),
    leaseExpiresAt: z.string().datetime().optional(),
    attempts: z.number().int().nonnegative(),
    createdAt: z.string(),
    updatedAt: z.string(),
    approvedSpec: z.string(),
});
export type Operation = z.infer<typeof operationSchema>;
export interface Observation {
    observedRevision: number;
    components: { id: string; healthy: boolean }[];
    endpoints: { id: string; url: string; healthy: boolean }[];
    failed?: boolean;
}
export interface Lease {
    operationId: string;
    leaseToken: string;
}
export interface BrainClient {
    list(): Promise<Operation[]>;
    claim(operationId: string): Promise<Operation>;
    observe(lease: Lease, observation: Observation): Promise<void>;
    complete(lease: Lease, status: 'SUCCEEDED' | 'FAILED'): Promise<void>;
    health(deploymentId: string, observation: Observation): Promise<void>;
}
export type Runner = (argv: string[], timeoutMs: number) => Promise<string>;
