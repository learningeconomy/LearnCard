import { TRPCError } from '@trpc/server';
import { WorkloadPlanValidator } from '@learncard/types';
import { createInstallIntentAuditEvent } from '@accesslayer/install-intent/audit';
import {
    assertWorkloadLease,
    listPendingWorkloadOperations,
    lockWorkloadDeployment,
    queueWorkloadOperation,
    readWorkloadDeployment,
    readWorkloadOperation,
    workloadTransaction,
} from '@accesslayer/workload-deployment/store';
import { getWorkloadDeployer } from './deployer';
import type { WorkloadDeploymentType } from 'types/install-target';
import type { WorkloadObservation, WorkloadOperation } from 'types/workload-lifecycle';
import { WorkloadAuditActionEnum, type WorkloadAuditAction } from 'types/install-intent-audit';

export const WORKLOAD_UNHEALTHY_THRESHOLD = 3;
export const WORKLOAD_STALE_MS = 120_000;

const audit = async (
    deployment: WorkloadDeploymentType,
    action: WorkloadAuditAction
): Promise<void> => {
    await createInstallIntentAuditEvent({
        action,
        ecosystemId: deployment.ecosystemId,
        intentId: deployment.intentId,
        afterSummary: {
            deploymentId: deployment.id,
            retainedObligations: deployment.retainedObligations ?? [],
        },
    });
};

export const submitWorkloadOperation = async (
    id: string,
    action: WorkloadOperation['action']
): Promise<void> => {
    const deployment = await readWorkloadDeployment(id);
    if (!deployment || deployment.status === 'RETIRED') return;
    const op = await queueWorkloadOperation(id, action);
    if (op.status === 'SUCCEEDED' || op.status === 'FAILED') return;
    if (deployment.operationRef === op.operationId) return;
    const driver = await getWorkloadDeployer(id);
    if (action === 'RETIRE') await driver.retire(op);
    else if (action === 'UPGRADE') await driver.upgrade(op);
    else await driver.apply(op);
    await audit(deployment, action === 'RETIRE' ? 'WORKLOAD_RETIRING' : 'WORKLOAD_APPLY_QUEUED');
};

export const reenqueueWorkloadOperations = async (): Promise<void> => {
    for (const operation of await listPendingWorkloadOperations(100)) {
        await (await getWorkloadDeployer(operation.deploymentId)).apply(operation);
    }
};

/** Endpoint addresses are opaque observations, not instructions for brain to fetch. */
export const validateWorkloadEndpoints = async (
    deployment: WorkloadDeploymentType,
    observation: WorkloadObservation
): Promise<WorkloadObservation> => {
    const spec = WorkloadPlanValidator.parse(JSON.parse(deployment.approvedSpec ?? '{}'));
    const seen = new Set<string>();
    const endpoints = observation.endpoints.map(
        (endpoint): WorkloadObservation['endpoints'][number] => {
            const declaration = spec.endpoints.find((entry): boolean => entry.id === endpoint.id);
            if (!declaration || seen.has(endpoint.id))
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Undeclared or duplicate workload endpoint.',
                });
            seen.add(endpoint.id);
            let url: URL;
            try {
                url = new URL(endpoint.url);
            } catch {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid workload endpoint URL.',
                });
            }
            url.username = '';
            url.password = '';
            if (!['http:', 'https:', 'tcp:'].includes(url.protocol) || !url.hostname)
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Unsupported workload endpoint scheme.',
                });
            for (const key of [...url.searchParams.keys()]) {
                if (
                    /token|secret|password|credential|authorization|api.?key|signature|access.?key/i.test(
                        key
                    )
                )
                    url.searchParams.delete(key);
            }
            url.hash = '';
            return { ...endpoint, url: url.toString() };
        }
    );
    const componentIds = new Set<string>();
    for (const component of observation.components) {
        if (
            componentIds.has(component.id) ||
            !spec.components.some((entry): boolean => entry.id === component.id)
        )
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Undeclared or duplicate workload component.',
            });
        componentIds.add(component.id);
    }
    return { ...observation, endpoints };
};

export const reportWorkloadObservation = async (input: {
    operationId: string;
    leaseToken: string;
    observation: WorkloadObservation;
}): Promise<void> => {
    const op = await readWorkloadOperation(input.operationId);
    if (!op) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workload operation not found.' });
    await applyWorkloadObservation(op.deploymentId, input.observation, input);
};

/** Ongoing health is accepted only after the current revision's apply/upgrade completed. */
export const reportDeploymentHealth = async (input: {
    deploymentId: string;
    observedRevision: number;
    components: WorkloadObservation['components'];
    endpoints: WorkloadObservation['endpoints'];
}): Promise<void> => {
    await applyWorkloadObservation(
        input.deploymentId,
        { ...input, failed: false },
        undefined,
        true
    );
};

export const applyWorkloadObservation = async (
    id: string,
    observation: WorkloadObservation,
    lease?: { operationId: string; leaseToken: string },
    completedOnly = false
): Promise<void> => {
    const before = await readWorkloadDeployment(id);
    if (!before)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workload deployment not found.' });
    const transition = await workloadTransaction(async (tx): Promise<string | null> => {
        const deployment = await lockWorkloadDeployment(tx, id);
        if (lease) await assertWorkloadLease(tx, lease.operationId, lease.leaseToken);
        if (completedOnly && deployment.lastAppliedRevision !== observation.observedRevision)
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Apply or upgrade has not completed.',
            });
        if (deployment.status === 'RETIRING' || deployment.status === 'RETIRED')
            throw new TRPCError({ code: 'CONFLICT', message: 'Deployment is retiring.' });
        if (observation.observedRevision !== deployment.desiredRevision)
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Workload observation revision is stale.',
            });
        const validated = await validateWorkloadEndpoints(deployment, observation);
        const spec = WorkloadPlanValidator.parse(JSON.parse(deployment.approvedSpec ?? '{}'));
        const healthy =
            spec.components.every((entry): boolean =>
                validated.components.some(
                    (value): boolean => value.id === entry.id && value.healthy
                )
            ) &&
            spec.endpoints.every((entry): boolean =>
                validated.endpoints.some((value): boolean => value.id === entry.id && value.healthy)
            );
        const failures = healthy ? 0 : (deployment.unhealthyObservations ?? 0) + 1;
        const status = validated.failed
            ? 'FAILED'
            : healthy
              ? 'READY'
              : (deployment.status === 'READY' || deployment.status === 'DEGRADED') &&
                  failures >= WORKLOAD_UNHEALTHY_THRESHOLD
                ? 'DEGRADED'
                : deployment.status;
        await tx.run(
            `MATCH (d:WorkloadDeployment {id: $id}) SET d.status = $status, d.checkedAt = $now,
            d.observedRevision = $revision, d.componentHealth = $components, d.endpointsObserved = $endpoints,
            d.unhealthyObservations = $failures, d.failureCode = $code, d.failureMessage = $message`,
            {
                id,
                status,
                now: new Date().toISOString(),
                revision: validated.observedRevision,
                components: JSON.stringify(validated.components),
                endpoints: JSON.stringify(validated.endpoints),
                failures,
                code:
                    status === 'FAILED'
                        ? 'DRIVER_FAILED'
                        : status === 'DEGRADED'
                          ? 'COMPONENT_UNHEALTHY'
                          : null,
                message:
                    status === 'FAILED'
                        ? 'Workload operation failed.'
                        : status === 'DEGRADED'
                          ? 'Workload health checks failed.'
                          : null,
            }
        );
        return status !== deployment.status ? status : null;
    });
    if (transition && ['READY', 'DEGRADED', 'FAILED'].includes(transition))
        await audit(before, WorkloadAuditActionEnum.parse(`WORKLOAD_${transition}`));
};

export const completeWorkloadOperation = async (input: {
    operationId: string;
    leaseToken: string;
    status: 'SUCCEEDED' | 'FAILED';
}): Promise<void> => {
    const op = await readWorkloadOperation(input.operationId);
    if (!op) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workload operation not found.' });
    const completed = await workloadTransaction(async (tx): Promise<WorkloadDeploymentType> => {
        const deployment = await lockWorkloadDeployment(tx, op.deploymentId);
        const current = await assertWorkloadLease(tx, input.operationId, input.leaseToken);
        const spec = WorkloadPlanValidator.parse(JSON.parse(current.approvedSpec));
        const obligations = [
            ...new Set([
                'issuer-key',
                'data',
                ...spec.endpoints
                    .filter((entry): boolean => entry.preserveOnRetirement === true)
                    .map((entry): string => String(entry.purpose)),
            ]),
        ];
        await tx.run(
            `MATCH (o:WorkloadOperation {operationId: $operationId}) SET o.status = $status, o.updatedAt = $now`,
            { ...input, now: new Date().toISOString() }
        );
        if (
            input.status === 'FAILED' &&
            current.specRevision === deployment.desiredRevision &&
            (deployment.status !== 'RETIRING' || current.action === 'RETIRE')
        ) {
            await tx.run(
                `MATCH (d:WorkloadDeployment {id: $id}) SET d.status = 'FAILED', d.failureCode = 'DRIVER_FAILED', d.failureMessage = 'Workload operation failed.'`,
                { id: deployment.id }
            );
        } else if (input.status === 'SUCCEEDED' && current.action === 'RETIRE') {
            await tx.run(
                `MATCH (d:WorkloadDeployment {id: $id}) SET d.status = 'RETIRED', d.retainedObligations = $obligations`,
                { id: deployment.id, obligations }
            );
        } else if (input.status === 'SUCCEEDED') {
            await tx.run(
                `MATCH (d:WorkloadDeployment {id: $id}) SET d.lastAppliedRevision = $revision`,
                { id: deployment.id, revision: current.specRevision }
            );
        }
        return { ...deployment, retainedObligations: obligations };
    });
    if (input.status === 'FAILED') await audit(completed, 'WORKLOAD_FAILED');
    else if (op.action === 'RETIRE') await audit(completed, 'WORKLOAD_RETIRED_WITH_OBLIGATIONS');
};

export const observeWorkloadDeployment = async (
    id: string,
    now = new Date()
): Promise<WorkloadDeploymentType | null> => {
    const deployment = await readWorkloadDeployment(id);
    if (!deployment || deployment.status === 'RETIRING' || deployment.status === 'RETIRED')
        return deployment;
    if (deployment.operationRef) {
        const observation = await (await getWorkloadDeployer(id)).status(deployment.operationRef);
        if (observation) await applyWorkloadObservation(id, observation);
    }
    const latest = await readWorkloadDeployment(id);
    const stale = await workloadTransaction(async (tx): Promise<boolean> => {
        const current = await lockWorkloadDeployment(tx, id);
        if (
            !['READY', 'APPLYING', 'DEGRADED'].includes(current.status) ||
            now.getTime() - new Date(current.checkedAt ?? current.createdAt).getTime() <=
                WORKLOAD_STALE_MS
        )
            return false;
        await tx.run(
            `MATCH (d:WorkloadDeployment {id: $id}) SET d.status = 'DEGRADED', d.failureCode = 'AGENT_STALE', d.failureMessage = 'Workload agent observations have expired.'`,
            { id }
        );
        return current.failureCode !== 'AGENT_STALE';
    });
    if (stale && latest) await audit(latest, 'WORKLOAD_DEGRADED');
    return readWorkloadDeployment(id);
};
