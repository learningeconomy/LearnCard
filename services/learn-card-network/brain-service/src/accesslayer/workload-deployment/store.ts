import { randomUUID } from 'node:crypto';
import type { ManagedTransaction } from 'neo4j-driver';
import { TRPCError } from '@trpc/server';
import {
    WorkloadComponentValidator,
    WorkloadPlanValidator,
    type WorkloadPlan,
} from '@learncard/types';
import { neogma } from '@instance';
import { WorkloadDeploymentValidator, type WorkloadDeploymentType } from 'types/install-target';
import { WorkloadOperationValidator, type WorkloadOperation } from 'types/workload-lifecycle';

export const workloadTransaction = async <T>(
    fn: (tx: ManagedTransaction) => Promise<T>
): Promise<T> => {
    const session = neogma.driver.session();
    try {
        return await session.executeWrite(fn);
    } finally {
        await session.close();
    }
};

export const readWorkloadDeployment = async (
    id: string
): Promise<WorkloadDeploymentType | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (d:WorkloadDeployment {id: $id}) RETURN properties(d) AS d',
        { id }
    );
    return result.records[0] ? WorkloadDeploymentValidator.parse(result.records[0].get('d')) : null;
};

export const readWorkloadOperation = async (
    operationId: string
): Promise<WorkloadOperation | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (o:WorkloadOperation {operationId: $operationId}) RETURN properties(o) AS o',
        { operationId }
    );
    return result.records[0] ? WorkloadOperationValidator.parse(result.records[0].get('o')) : null;
};

export const listPendingWorkloadOperations = async (
    limit: number
): Promise<WorkloadOperation[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (o:WorkloadOperation), (d:WorkloadDeployment {id: o.deploymentId})
         WHERE d.driver = 'local-compose' AND (o.status = 'QUEUED' OR (o.status = 'CLAIMED' AND o.leaseExpiresAt <= $now))
         RETURN properties(o) AS o ORDER BY o.createdAt, o.operationId LIMIT toInteger($limit)`,
        { now: new Date().toISOString(), limit }
    );
    return result.records.map((record): WorkloadOperation =>
        WorkloadOperationValidator.parse(record.get('o'))
    );
};

export const createWorkloadDeployment = async (input: {
    id: string;
    intentId: string;
    ecosystemId: string;
    declarationId: string;
    desiredRevision: number;
    approvedSpec: WorkloadPlan;
    driver?: 'fake' | 'local-compose';
}): Promise<WorkloadDeploymentType> => {
    const spec = WorkloadPlanValidator.parse(input.approvedSpec);
    await neogma.queryRunner.run(
        'CREATE CONSTRAINT workload_deployment_id IF NOT EXISTS FOR (d:WorkloadDeployment) REQUIRE d.id IS UNIQUE'
    );
    await neogma.queryRunner.run(
        'CREATE CONSTRAINT workload_operation_id IF NOT EXISTS FOR (o:WorkloadOperation) REQUIRE o.operationId IS UNIQUE'
    );
    const result = await neogma.queryRunner.run(
        `MATCH (e:Ecosystem {id: $ecosystemId}), (i:InstallIntent {intentId: $intentId}),
               (v:WorkloadPackageVersion {versionId: $packageVersionId})
         MERGE (d:WorkloadDeployment {id: $id})
         ON CREATE SET d += $properties
         MERGE (e)-[:HAS_WORKLOAD]->(d)
         MERGE (d)-[:DEPLOYS]->(v)
         MERGE (i)-[:REALIZES]->(v)
         RETURN properties(d) AS d`,
        {
            ...input,
            packageVersionId: spec.packageVersionId,
            properties: {
                apiVersion: 'lc.install-target/v1',
                id: input.id,
                intentId: input.intentId,
                ecosystemId: input.ecosystemId,
                declarationId: input.declarationId,
                targetType: 'WORKLOAD_DEPLOYMENT',
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                desiredRevision: input.desiredRevision,
                driver: input.driver ?? spec.driver,
                packageVersionId: spec.packageVersionId,
                packageId: spec.packageId,
                manifestHash: spec.manifestHash,
                profiles: spec.profiles,
                approvedSpec: JSON.stringify(spec),
                retainedObligations: [],
                unhealthyObservations: 0,
            },
        }
    );
    if (!result.records[0])
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Workload ownership or package is missing.',
        });
    return workloadTransaction(async (tx): Promise<WorkloadDeploymentType> => {
        const current = await lockWorkloadDeployment(tx, input.id);
        if (input.desiredRevision <= (current.desiredRevision ?? 0)) return current;
        if (current.status === 'RETIRING' || current.status === 'RETIRED')
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Retiring workloads cannot be upgraded.',
            });
        const updated = await tx.run(
            `MATCH (d:WorkloadDeployment {id: $id}), (v:WorkloadPackageVersion {versionId: $packageVersionId})
             SET d.desiredRevision = $revision, d.approvedSpec = $spec, d.packageVersionId = $packageVersionId,
                 d.packageId = $packageId, d.manifestHash = $manifestHash, d.profiles = $profiles,
                 d.status = 'PENDING', d.unhealthyObservations = 0.0
             MERGE (d)-[:DEPLOYS]->(v) RETURN properties(d) AS d`,
            {
                id: input.id,
                revision: input.desiredRevision,
                spec: JSON.stringify(spec),
                packageVersionId: spec.packageVersionId,
                packageId: spec.packageId,
                manifestHash: spec.manifestHash,
                profiles: spec.profiles,
            }
        );
        return WorkloadDeploymentValidator.parse(updated.records[0]?.get('d'));
    });
};

/** Lock the deployment before inspecting leases. Neo4j serializes all writers to this node. */
export const lockWorkloadDeployment = async (
    tx: ManagedTransaction,
    id: string
): Promise<WorkloadDeploymentType> => {
    const result = await tx.run(
        `MATCH (d:WorkloadDeployment {id: $id}) SET d.lockVersion = coalesce(d.lockVersion, 0) + 1 RETURN properties(d) AS d`,
        { id }
    );
    if (!result.records[0])
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workload deployment not found.' });
    return WorkloadDeploymentValidator.parse(result.records[0].get('d'));
};

export const queueWorkloadOperation = async (
    deploymentId: string,
    action: WorkloadOperation['action']
): Promise<WorkloadOperation> =>
    workloadTransaction(async (tx): Promise<WorkloadOperation> => {
        const deployment = await lockWorkloadDeployment(tx, deploymentId);
        if (
            deployment.status === 'RETIRED' ||
            (deployment.status === 'RETIRING' && action !== 'RETIRE')
        )
            throw new TRPCError({ code: 'CONFLICT', message: 'Deployment is retiring.' });
        if (deployment.desiredRevision === undefined || !deployment.approvedSpec)
            throw new TRPCError({
                code: 'PRECONDITION_FAILED',
                message: 'Approved workload specification is missing.',
            });
        const operationId = `${deploymentId}:${deployment.desiredRevision}:${action}`;
        const now = new Date().toISOString();
        const result = await tx.run(
            `MERGE (o:WorkloadOperation {operationId: $operationId})
             ON CREATE SET o.deploymentId = $deploymentId, o.action = $action, o.specRevision = $revision,
               o.status = 'QUEUED', o.attempts = 0.0, o.createdAt = $now, o.updatedAt = $now, o.approvedSpec = $approvedSpec
             RETURN properties(o) AS o`,
            {
                operationId,
                deploymentId,
                action,
                revision: deployment.desiredRevision,
                now,
                approvedSpec: deployment.approvedSpec,
            }
        );
        const operation = WorkloadOperationValidator.parse(result.records[0]?.get('o'));
        if (operation.status === 'QUEUED' && deployment.operationRef !== operationId) {
            await tx.run(
                `MATCH (d:WorkloadDeployment {id: $deploymentId})
                SET d.operationRef = $operationId, d.status = $status`,
                { deploymentId, operationId, status: action === 'RETIRE' ? 'RETIRING' : 'APPLYING' }
            );
        }
        return operation;
    });

export const claimWorkloadOperation = async (operationId: string): Promise<WorkloadOperation> => {
    const operation = await readWorkloadOperation(operationId);
    if (!operation)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workload operation not found.' });
    return workloadTransaction(async (tx): Promise<WorkloadOperation> => {
        const deployment = await lockWorkloadDeployment(tx, operation.deploymentId);
        if (
            operation.operationId.includes(':RECOVER:') &&
            (deployment.desiredRevision !== operation.specRevision ||
                deployment.status !== 'APPLYING' ||
                deployment.operationRef !== operationId)
        )
            throw new TRPCError({ code: 'CONFLICT', message: 'Recovery authorization is stale.' });
        if (deployment.driver !== 'local-compose')
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Operation belongs to another driver.',
            });
        const now = new Date().toISOString();
        const plan = WorkloadPlanValidator.parse(JSON.parse(operation.approvedSpec));
        const components = plan.execution
            ? WorkloadComponentValidator.array().max(256).parse(plan.execution.components)
            : [];
        const leaseMs = components.some(
            (component): boolean => component.lifecycle?.kind === 'init'
        )
            ? 60000 +
              components.reduce(
                  (total, component): number =>
                      total +
                      40000 +
                      (component.lifecycle?.kind === 'init'
                          ? component.lifecycle.timeoutMs
                          : component.healthcheck!.startupDeadlineMs),
                  0
              )
            : 60000;
        const result = await tx.run(
            `MATCH (o:WorkloadOperation {operationId: $operationId})
             WHERE (o.status = 'QUEUED' OR (o.status = 'CLAIMED' AND o.leaseExpiresAt <= $now))
                AND NOT EXISTS { MATCH (other:WorkloadOperation {deploymentId: o.deploymentId})
                  WHERE other.operationId <> o.operationId AND
                    ((other.status = 'CLAIMED' AND other.leaseExpiresAt > $now) OR
                     (other.status IN ['QUEUED', 'CLAIMED'] AND
                      (other.specRevision < o.specRevision OR
                       (other.specRevision = o.specRevision AND other.action <> 'RETIRE' AND o.action = 'RETIRE')))) }
             SET o.status = 'CLAIMED', o.leaseToken = $token, o.leaseExpiresAt = $expires,
                 o.attempts = o.attempts + 1, o.updatedAt = $now
             RETURN properties(o) AS o`,
            {
                operationId,
                revision: deployment.desiredRevision,
                now,
                token: randomUUID(),
                expires: new Date(Date.now() + leaseMs).toISOString(),
            }
        );
        if (!result.records[0])
            throw new TRPCError({ code: 'CONFLICT', message: 'Operation is not claimable.' });
        return WorkloadOperationValidator.parse(result.records[0].get('o'));
    });
};

/** Recovery is a new leased operation, never permission to replay local state. */
export const queueWorkloadRecovery = async (
    deploymentId: string,
    revision: number
): Promise<WorkloadOperation> =>
    workloadTransaction(async (tx): Promise<WorkloadOperation> => {
        const deployment = await lockWorkloadDeployment(tx, deploymentId);
        if (
            !['READY', 'DEGRADED'].includes(deployment.status) ||
            deployment.driver !== 'local-compose' ||
            deployment.desiredRevision !== revision ||
            deployment.lastAppliedRevision !== revision ||
            !deployment.approvedSpec
        )
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Deployment is not eligible for recovery.',
            });
        const previous = await tx.run(
            `MATCH (o:WorkloadOperation {operationId: $id}) WHERE o.status = 'SUCCEEDED' RETURN o.operationId AS id`,
            { id: deployment.operationRef }
        );
        const pending = await tx.run(
            `MATCH (o:WorkloadOperation {deploymentId: $id}) WHERE o.status IN ['QUEUED', 'CLAIMED'] RETURN o.operationId AS id LIMIT 1`,
            { id: deploymentId }
        );
        if (!previous.records.length || pending.records.length)
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Recovery requires a completed current operation.',
            });
        const operation: WorkloadOperation = {
            operationId: `${deploymentId}:${revision}:RECOVER:${randomUUID()}`,
            deploymentId,
            action: 'UPGRADE',
            specRevision: revision,
            status: 'QUEUED',
            attempts: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvedSpec: deployment.approvedSpec,
        };
        await tx.run(
            `CREATE (o:WorkloadOperation) SET o = $operation WITH o MATCH (d:WorkloadDeployment {id: $id}) SET d.operationRef = o.operationId, d.status = 'APPLYING'`,
            { operation, id: deploymentId }
        );
        return operation;
    });

export const assertWorkloadLease = async (
    tx: ManagedTransaction,
    operationId: string,
    leaseToken: string
): Promise<WorkloadOperation> => {
    const result = await tx.run(
        `MATCH (o:WorkloadOperation {operationId: $operationId}) WHERE o.status = 'CLAIMED'
           AND o.leaseToken = $leaseToken AND o.leaseExpiresAt > $now RETURN properties(o) AS o`,
        { operationId, leaseToken, now: new Date().toISOString() }
    );
    if (!result.records[0])
        throw new TRPCError({ code: 'CONFLICT', message: 'Workload lease is stale.' });
    return WorkloadOperationValidator.parse(result.records[0].get('o'));
};
