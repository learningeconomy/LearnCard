import type { BrainClient, Operation, Lease } from './types';
import type { Deployment, Driver } from './compose-driver';
import type { HealthProbe } from './health';
import { AgentError, type Redactor } from './redact';

export class Jobs {
    private readonly locks = new Map<string, Promise<void>>();
    private readonly active = new Map<string, Deployment>();
    constructor(
        private readonly brain: BrainClient,
        private readonly driver: Driver,
        private readonly probe: HealthProbe,
        private readonly log: Redactor,
        private readonly now: () => number = Date.now
    ) {}
    async serialized(id: string, work: () => Promise<void>): Promise<void> {
        const prior = this.locks.get(id) ?? Promise.resolve();
        const task = prior.catch((): void => {}).then(work);
        this.locks.set(id, task);
        try {
            await task;
        } finally {
            if (this.locks.get(id) === task) this.locks.delete(id);
        }
    }
    async recover(): Promise<void> {
        for (const deployment of await this.driver.recover())
            this.active.set(deployment.operation.deploymentId, deployment);
    }
    async execute(discovered: Operation): Promise<void> {
        await this.serialized(discovered.deploymentId, async (): Promise<void> => {
            let lease: Lease | undefined;
            let expires = 0;
            let completionAttempted = false;
            try {
                const operation = await this.brain.claim(discovered.operationId);
                if (
                    !operation.leaseToken ||
                    !operation.leaseExpiresAt ||
                    operation.deploymentId !== discovered.deploymentId
                )
                    throw new AgentError('LEASE_INVALID');
                lease = { operationId: operation.operationId, leaseToken: operation.leaseToken };
                expires = Date.parse(operation.leaseExpiresAt);
                this.active.delete(operation.deploymentId);
                const budget = (): number => {
                    // Reserve disconnect + observation/completion HTTP deadlines + scheduling slack.
                    const remaining = expires - this.now() - 15000;
                    if (remaining < 1000) throw new AgentError('LEASE_BUDGET_EXCEEDED');
                    return remaining;
                };
                budget();
                // Never replay daemon mutations after a lost lease. A fresh claim may safely
                // terminalize the abandoned operation, unblocking a queued RETIRE.
                if (operation.attempts > 1) {
                    this.log.log('RECLAIMED_OPERATION_REQUIRES_REVIEW');
                    await this.brain.complete(lease, 'FAILED');
                    return;
                }
                if (operation.action === 'RETIRE') {
                    await this.driver.retire(operation, budget);
                    budget();
                    await this.brain.complete(lease, 'SUCCEEDED');
                    return;
                }
                const deployment = await this.driver.prepare(operation, budget);
                budget();
                // Persist before completion: recovery reports are revision-guarded by brain.
                await this.driver.remember(deployment);
                await this.driver.apply(deployment, budget);
                const started = this.now();
                while (true) {
                    const observation = await this.probe(deployment, budget);
                    budget();
                    await this.brain.observe(lease, observation);
                    if (
                        observation.components.every((c): boolean => c.healthy) &&
                        observation.endpoints.every((e): boolean => e.healthy)
                    )
                        break;
                    const elapsed = this.now() - started;
                    if (
                        deployment.spec.components.some(
                            (c): boolean =>
                                elapsed >= c.healthcheck.startupDeadlineMs &&
                                !observation.components.some(
                                    (seen): boolean => seen.id === c.id && seen.healthy
                                )
                        ) ||
                        elapsed >=
                            Math.max(
                                ...deployment.spec.components.map(
                                    (c): number => c.healthcheck.startupDeadlineMs
                                )
                            )
                    )
                        throw new AgentError('HEALTH_STARTUP_FAILED');
                    const interval = Math.min(
                        ...deployment.spec.components.map((c): number => c.healthcheck.intervalMs)
                    );
                    if (budget() < interval + 1000) throw new AgentError('LEASE_BUDGET_EXCEEDED');
                    await new Promise<void>((resolve): void => {
                        setTimeout(resolve, interval);
                    });
                }
                if (expires - this.now() < 3000) throw new AgentError('LEASE_BUDGET_EXCEEDED');
                this.active.set(operation.deploymentId, deployment);
                completionAttempted = true;
                await this.brain.complete(lease, 'SUCCEEDED');
            } catch (error) {
                this.log.error(error);
                if (error instanceof AgentError && error.code === 'CONFLICT') {
                    if (lease) this.active.delete(discovered.deploymentId);
                    return;
                }
                // Completion may have committed before its response was lost. Let revision-
                // guarded health confirm it instead of falsely sending FAILED afterwards.
                if (completionAttempted) return;
                if (lease && expires - this.now() > 3000) {
                    try {
                        await this.brain.complete(lease, 'FAILED');
                    } catch (failure) {
                        this.log.error(failure);
                    }
                }
            }
        });
    }
    async poll(): Promise<void> {
        const operations = await this.brain.list();
        this.log.log(operations.length ? 'AUTHENTICATED_POLL_PENDING' : 'AUTHENTICATED_POLL_EMPTY');
        // Sequential discovery preserves oldest-first order; keyed locks also protect wake-ups/health.
        for (const operation of operations) await this.execute(operation);
    }
    async health(): Promise<void> {
        for (const [id, deployment] of this.active)
            await this.serialized(id, async (): Promise<void> => {
                if (this.active.get(id) !== deployment) return;
                const deadline = this.now() + 45000;
                try {
                    const observation = await this.probe(deployment, (): number => {
                        const left = deadline - this.now();
                        if (left < 1000) throw new AgentError('HEALTH_BUDGET_EXCEEDED');
                        return left;
                    });
                    await this.brain.health(id, observation);
                } catch (error) {
                    this.log.error(error);
                    if (error instanceof AgentError && error.code === 'CONFLICT')
                        this.active.delete(id);
                }
            });
    }
}
