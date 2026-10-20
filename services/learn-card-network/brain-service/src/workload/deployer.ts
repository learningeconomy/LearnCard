import { TRPCError } from '@trpc/server';
import { WorkloadPlanValidator } from '@learncard/types';
import cache from '@cache';
import { readWorkloadDeployment } from '@accesslayer/workload-deployment/store';
import type {
    WorkloadDriverPlan,
    WorkloadPlanInput,
    WorkloadOperation,
    OperationHandle,
    WorkloadObservation,
} from 'types/workload-lifecycle';

export interface WorkloadDeployer {
    plan(input: WorkloadPlanInput): Promise<WorkloadDriverPlan>;
    apply(op: WorkloadOperation): Promise<OperationHandle>;
    status(ref: string): Promise<WorkloadObservation | null>;
    upgrade(op: WorkloadOperation): Promise<OperationHandle>;
    retire(op: WorkloadOperation): Promise<OperationHandle>;
}

/** Redis wakes the future agent; polling durable operations must also work without it. */
export class QueuedAgentDeployer implements WorkloadDeployer {
    async plan(input: WorkloadPlanInput): Promise<WorkloadDriverPlan> {
        return { approvedSpec: WorkloadPlanValidator.parse(input.approvedSpec) };
    }
    async apply(op: WorkloadOperation): Promise<OperationHandle> {
        try {
            await (cache.redis ?? cache.node).publish('workload-operations', op.operationId);
        } catch {
            /* Durable queue remains available for polling when Redis is unavailable. */
        }
        return { operationRef: op.operationId };
    }
    async upgrade(op: WorkloadOperation): Promise<OperationHandle> {
        return this.apply(op);
    }
    async retire(op: WorkloadOperation): Promise<OperationHandle> {
        return this.apply(op);
    }
    async status(_ref: string): Promise<WorkloadObservation | null> {
        // Agent observations are persisted by the restricted report route, not fabricated here.
        return null;
    }
}

/** Explicitly injected in tests/dev. Never selected by an untrusted request or a package. */
export class FakeWorkloadDeployer implements WorkloadDeployer {
    private readonly operations = new Map<string, WorkloadOperation>();
    mode: 'healthy' | 'unhealthy' | 'partial' | 'failed' = 'healthy';
    async plan(input: WorkloadPlanInput): Promise<WorkloadDriverPlan> {
        return { approvedSpec: input.approvedSpec };
    }
    async apply(op: WorkloadOperation): Promise<OperationHandle> {
        this.operations.set(op.operationId, op);
        return { operationRef: op.operationId };
    }
    async upgrade(op: WorkloadOperation): Promise<OperationHandle> {
        return this.apply(op);
    }
    async retire(op: WorkloadOperation): Promise<OperationHandle> {
        return this.apply(op);
    }
    async status(ref: string): Promise<WorkloadObservation | null> {
        const op = this.operations.get(ref);
        if (!op) return null;
        const spec = WorkloadPlanValidator.parse(JSON.parse(op.approvedSpec));
        return {
            observedRevision: op.specRevision,
            components: spec.components.map(
                (component, index): WorkloadObservation['components'][number] => ({
                    id: component.id,
                    healthy: this.mode === 'healthy' || (this.mode === 'partial' && index > 0),
                })
            ),
            endpoints: spec.endpoints.map((endpoint): WorkloadObservation['endpoints'][number] => ({
                id: String(endpoint.id),
                url: `https://workload.example/${String(endpoint.id)}`,
                healthy: this.mode === 'healthy',
            })),
            failed: this.mode === 'failed',
        };
    }
}

const queuedDriver = new QueuedAgentDeployer();
const fakeDriver = new FakeWorkloadDeployer();
export const getWorkloadDeployer = async (deploymentId: string): Promise<WorkloadDeployer> => {
    const deployment = await readWorkloadDeployment(deploymentId);
    if (deployment?.driver === 'local-compose') return queuedDriver;
    if (deployment?.driver === 'fake') return fakeDriver;
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Unsupported workload driver.' });
};
