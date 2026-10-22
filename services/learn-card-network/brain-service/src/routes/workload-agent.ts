import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { environment } from '@environment';
import { openRoute, t } from '@routes';
import {
    claimWorkloadOperation,
    listPendingWorkloadOperations,
    queueWorkloadRecovery,
} from '@accesslayer/workload-deployment/store';
import {
    reportWorkloadObservation,
    completeWorkloadOperation,
    reportDeploymentHealth,
} from '../workload/lifecycle';
import {
    WorkloadObservationValidator,
    WorkloadOperationValidator,
    type WorkloadOperation,
} from 'types/workload-lifecycle';

const agentRoute = openRoute.use(async ({ ctx, next }) => {
    const expected = environment.WORKLOAD_AGENT_TOKEN;
    const received = ctx.workloadAgentToken;
    if (
        !expected ||
        !received ||
        !timingSafeEqual(
            createHash('sha256').update(expected).digest(),
            createHash('sha256').update(received).digest()
        )
    )
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Workload agent authentication required.',
        });
    return next();
});
const lease = z.object({ operationId: z.string().max(512), leaseToken: z.string().uuid() });

export const workloadAgentRouter = t.router({
    queueWorkloadRecovery: agentRoute
        .input(
            z.object({
                deploymentId: z.string().min(1).max(512),
                revision: z.number().int().nonnegative(),
            })
        )
        .output(WorkloadOperationValidator)
        .mutation(async ({ input }): Promise<WorkloadOperation> =>
            queueWorkloadRecovery(input.deploymentId, input.revision)
        ),
    listPendingWorkloadOperations: agentRoute
        .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
        .output(z.array(WorkloadOperationValidator))
        .query(async ({ input }): Promise<WorkloadOperation[]> =>
            listPendingWorkloadOperations(input.limit)
        ),
    reportDeploymentHealth: agentRoute
        .input(
            WorkloadObservationValidator.omit({ failed: true }).extend({
                deploymentId: z.string().min(1).max(512),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input }): Promise<boolean> => {
            await reportDeploymentHealth(input);
            return true;
        }),
    claimWorkloadOperation: agentRoute
        .input(z.object({ operationId: z.string().max(512) }))
        .output(WorkloadOperationValidator)
        .mutation(async ({ input }): Promise<WorkloadOperation> =>
            claimWorkloadOperation(input.operationId)
        ),
    reportWorkloadObservation: agentRoute
        .input(lease.extend({ observation: WorkloadObservationValidator }))
        .output(z.boolean())
        .mutation(async ({ input }): Promise<boolean> => {
            await reportWorkloadObservation(input);
            return true;
        }),
    completeWorkloadOperation: agentRoute
        .input(lease.extend({ status: z.enum(['SUCCEEDED', 'FAILED']) }))
        .output(z.boolean())
        .mutation(async ({ input }): Promise<boolean> => {
            await completeWorkloadOperation(input);
            return true;
        }),
});
export type WorkloadAgentRouter = typeof workloadAgentRouter;
