import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { open, readdir, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import type { AgentConfig } from './config';
import { AgentError, type Redactor } from './redact';
import {
    componentName,
    initialPort,
    parseSpec,
    portKey,
    projectName,
    render,
    safeName,
    type Spec,
} from './render';
import { createHealthProbe, dependencyOrder, type HealthProbe } from './health';
import { privateDirectory, provisionSecrets, readPrivate } from './secrets';
import { operationSchema, type Operation, type Runner } from './types';

const exec = promisify(execFile);
export const runDocker: Runner = async (argv, timeoutMs): Promise<string> => {
    if (timeoutMs <= 0) throw new AgentError('LEASE_BUDGET_EXCEEDED');
    try {
        const result = await exec('docker', argv, {
            timeout: timeoutMs,
            killSignal: 'SIGKILL',
            maxBuffer: 1024 * 1024,
            encoding: 'utf8',
        });
        return result.stdout;
    } catch (error) {
        if (error && typeof error === 'object' && 'killed' in error && error.killed)
            throw new AgentError('LEASE_BUDGET_EXCEEDED');
        throw new AgentError('DOCKER_COMMAND_FAILED');
    }
};

export interface Deployment {
    operation: Operation;
    spec: Spec;
    ports: Record<string, number>;
    attempt?: string;
    completedInits?: Set<string>;
}
const stateSchema = z.object({
    operation: operationSchema,
    attempt: z.string().optional(),
    ports: z.record(z.string(), z.number().int().min(20000).max(49999)),
});
export interface Driver {
    prepare(operation: Operation, budget: () => number): Promise<Deployment>;
    apply(deployment: Deployment, budget: () => number): Promise<void>;
    retire(operation: Operation, budget: () => number): Promise<void>;
    recover(): Promise<Deployment[]>;
    remember(deployment: Deployment): Promise<void>;
}

export class ComposeDriver implements Driver {
    constructor(
        private readonly config: AgentConfig,
        private readonly redactor: Redactor,
        public readonly run: Runner = runDocker,
        private readonly healthProbe?: HealthProbe
    ) {}
    private file(id: string): string {
        return join(this.config.WORKLOAD_SECRETS_DIR, projectName(id), 'compose.yaml');
    }
    private marker(id: string): string {
        return join(this.config.WORKLOAD_SECRETS_DIR, projectName(id), 'mutation-unresolved');
    }
    private async assertResolved(id: string): Promise<void> {
        try {
            await readPrivate(this.marker(id));
        } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
                return;
            throw new AgentError('MUTATION_RECONCILIATION_REQUIRED');
        }
        throw new AgentError('MUTATION_RECONCILIATION_REQUIRED');
    }
    private async mutate(id: string, argv: string[], timeout: number): Promise<void> {
        const marker = await open(this.marker(id), 'wx', 0o600);
        try {
            await marker.writeFile('Operator reconciliation required if this marker survives.');
            await marker.sync();
        } finally {
            await marker.close();
        }
        // A timeout cannot cancel a daemon request. Leave the durable interlock on any ambiguity.
        await this.run(argv, timeout);
        await unlink(this.marker(id));
    }
    private async save(path: string, content: string): Promise<void> {
        const temporary = `${path}.tmp`;
        const handle = await open(temporary, 'w', 0o600);
        try {
            await handle.writeFile(content);
            await handle.sync();
        } finally {
            await handle.close();
        }
        await rename(temporary, path);
    }
    private async ports(spec: Spec, id: string): Promise<Record<string, number>> {
        const dir = join(this.config.WORKLOAD_SECRETS_DIR, '_ports');
        await privateDirectory(dir);
        const ports: Record<string, number> = {};
        const keys = [
            ...new Set(
                spec.endpoints
                    .filter((e): boolean => e.visibility !== 'internal')
                    .map((e): string => portKey(e.component, e.port))
            ),
        ].sort();
        for (const key of keys) {
            const owner = `${id}:${key}`;
            const start = initialPort(id, key);
            for (let offset = 0; offset < 30000; offset++) {
                const port = 20000 + ((start - 20000 + offset) % 30000);
                const file = join(dir, String(port));
                try {
                    const handle = await open(file, 'wx', 0o600);
                    try {
                        await handle.writeFile(owner);
                    } finally {
                        await handle.close();
                    }
                    ports[key] = port;
                    break;
                } catch (error) {
                    if (!(
                        error &&
                        typeof error === 'object' &&
                        'code' in error &&
                        error.code === 'EEXIST'
                    ))
                        throw new AgentError('PORT_ALLOCATION_FAILED');
                    if ((await readPrivate(file)) === owner) {
                        ports[key] = port;
                        break;
                    }
                }
            }
            if (!ports[key]) throw new AgentError('PORTS_EXHAUSTED');
        }
        return ports;
    }
    async prepare(operation: Operation, budget: () => number): Promise<Deployment> {
        await this.assertResolved(operation.deploymentId);
        const spec = parseSpec(operation.approvedSpec, this.config);
        const architecture = (
            await this.run(['info', '--format', '{{.Architecture}}'], Math.min(3000, budget()))
        ).trim();
        const platform =
            architecture === 'aarch64' || architecture === 'arm64'
                ? 'linux/arm64'
                : architecture === 'x86_64' || architecture === 'amd64'
                  ? 'linux/amd64'
                  : '';
        if (spec.components.some((c): boolean => c.platform !== platform))
            throw new AgentError('PLATFORM_MISMATCH');
        for (const image of new Set(spec.components.map((c): string => c.image)))
            await this.run(['pull', image], Math.min(20000, budget()));
        budget();
        await privateDirectory(this.config.WORKLOAD_SECRETS_DIR);
        await privateDirectory(
            join(this.config.WORKLOAD_SECRETS_DIR, projectName(operation.deploymentId))
        );
        await provisionSecrets(
            this.config.WORKLOAD_SECRETS_DIR,
            operation.deploymentId,
            spec,
            this.redactor
        );
        const ports = await this.ports(spec, operation.deploymentId);
        const attempt = randomUUID();
        const rendered = render(
            spec,
            operation.deploymentId,
            operation.specRevision,
            this.config,
            ports,
            attempt
        );
        await this.save(this.file(operation.deploymentId), rendered.yaml);
        return { operation, spec, ports, attempt, completedInits: new Set<string>() };
    }
    async apply(deployment: Deployment, budget: () => number): Promise<void> {
        const probe =
            this.healthProbe ?? createHealthProbe(this.run, this.config.WORKLOAD_AGENT_CONTAINER);
        deployment.completedInits = new Set<string>();
        const hasInit = deployment.spec.components.some(
            (c): boolean => c.lifecycle?.kind === 'init'
        );
        if (hasInit) {
            // Previously running dependents must not keep serving during a new init attempt.
            for (const component of [...dependencyOrder(deployment.spec.components)].reverse()) {
                if (component.dependsOn.length === 0) continue;
                await this.mutate(
                    deployment.operation.deploymentId,
                    [
                        'compose',
                        '-p',
                        projectName(deployment.operation.deploymentId),
                        '-f',
                        this.file(deployment.operation.deploymentId),
                        'stop',
                        '--timeout',
                        '5',
                        safeName(component.id),
                    ],
                    Math.min(10000, budget())
                );
            }
        }
        const started = new Set<string>();
        for (const component of dependencyOrder(deployment.spec.components)) {
            const init = component.lifecycle?.kind === 'init';
            const deadline =
                Date.now() +
                (component.lifecycle?.kind === 'init'
                    ? component.lifecycle.timeoutMs
                    : component.healthcheck!.startupDeadlineMs);
            try {
                await this.mutate(
                    deployment.operation.deploymentId,
                    [
                        'compose',
                        '-p',
                        projectName(deployment.operation.deploymentId),
                        '-f',
                        this.file(deployment.operation.deploymentId),
                        'up',
                        '-d',
                        '--no-deps',
                        '--remove-orphans',
                        '--pull',
                        'never',
                        ...(init ? ['--force-recreate'] : []),
                        safeName(component.id),
                    ],
                    Math.min(20000, budget(), Math.max(1, deadline - Date.now()))
                );
            } catch (error) {
                if (init) throw new AgentError('INIT_START_FAILED');
                throw error;
            }
            started.add(component.id);
            if (init) {
                let containerId: string | undefined;
                let exited = false;
                try {
                    while (true) {
                        if (Date.now() >= deadline) {
                            throw new AgentError('INIT_TIMEOUT');
                        }
                        const state = z
                            .object({
                                Id: z.string().regex(/^[a-f0-9]{64}$/),
                                State: z.object({
                                    Status: z.string(),
                                    ExitCode: z.number().int(),
                                    OOMKilled: z.boolean(),
                                }),
                                Config: z.object({ Labels: z.record(z.string(), z.string()) }),
                            })
                            .array()
                            .parse(
                                JSON.parse(
                                    await this.run(
                                        [
                                            'inspect',
                                            componentName(
                                                deployment.operation.deploymentId,
                                                component.id
                                            ),
                                        ],
                                        Math.min(5000, budget(), Math.max(1, deadline - Date.now()))
                                    )
                                )
                            )[0];
                        const labels = state?.Config.Labels;
                        if (
                            !state ||
                            labels?.['org.learncard.workload.deployment'] !==
                                deployment.operation.deploymentId ||
                            labels['org.learncard.workload.revision'] !==
                                String(deployment.operation.specRevision) ||
                            !deployment.attempt ||
                            labels['org.learncard.workload.component'] !== component.id ||
                            labels['org.learncard.workload.attempt'] !== deployment.attempt
                        )
                            throw new AgentError('INIT_START_FAILED');
                        containerId = state.Id;
                        exited = state.State.Status === 'exited' || state.State.Status === 'dead';
                        if (Date.now() >= deadline) throw new AgentError('INIT_TIMEOUT');
                        if (state.State.Status === 'exited' || state.State.Status === 'dead') {
                            if (
                                state.State.Status !== 'exited' ||
                                state.State.ExitCode !== 0 ||
                                state.State.OOMKilled
                            )
                                throw new AgentError('INIT_FAILED');
                            deployment.completedInits?.add(component.id);
                            break;
                        }
                        if (budget() < 2000) {
                            throw new AgentError('INIT_TIMEOUT');
                        }
                        await new Promise<void>((resolve): void => {
                            setTimeout(resolve, 250);
                        });
                    }
                } catch (error) {
                    if (!exited) {
                        // Cleanup uses the reserved disconnect/completion budget, not budget().
                        // Never kill a replacement container by name after validating an ID.
                        if (containerId) {
                            await this.mutate(
                                deployment.operation.deploymentId,
                                ['kill', containerId],
                                5000
                            );
                        } else {
                            await this.save(
                                this.marker(deployment.operation.deploymentId),
                                'Init identity unresolved; operator reconciliation required.'
                            );
                        }
                    }
                    if (error instanceof AgentError && error.code === 'LEASE_BUDGET_EXCEEDED')
                        throw new AgentError('INIT_TIMEOUT');
                    throw error;
                }
            } else {
                const partial: Deployment = {
                    ...deployment,
                    spec: {
                        ...deployment.spec,
                        components: deployment.spec.components.filter((c): boolean =>
                            started.has(c.id)
                        ),
                        endpoints: [],
                    },
                };
                while (true) {
                    const observation = await probe(partial, budget);
                    if (
                        observation.components.every(
                            (c): boolean => c.healthy || c.completed === true
                        )
                    )
                        break;
                    if (Date.now() >= deadline) throw new AgentError('HEALTH_STARTUP_FAILED');
                    await new Promise<void>((resolve): void => {
                        setTimeout(resolve, Math.min(1000, component.healthcheck!.intervalMs));
                    });
                }
            }
        }
    }
    async retire(operation: Operation, budget: () => number): Promise<void> {
        await this.assertResolved(operation.deploymentId);
        // Approved spec is still checked; never operate on caller-provided project names.
        parseSpec(operation.approvedSpec, this.config);
        const file = this.file(operation.deploymentId);
        try {
            await readPrivate(file);
        } catch {
            throw new AgentError('RECOVERY_STATE_MISSING');
        }
        await this.mutate(
            operation.deploymentId,
            [
                'compose',
                '-p',
                projectName(operation.deploymentId),
                '-f',
                file,
                'down',
                '--timeout',
                '5',
            ],
            Math.min(20000, budget())
        );
        await this.save(
            join(this.config.WORKLOAD_SECRETS_DIR, projectName(operation.deploymentId), 'retired'),
            'true'
        );
    }
    async remember(deployment: Deployment): Promise<void> {
        await this.save(
            join(
                this.config.WORKLOAD_SECRETS_DIR,
                projectName(deployment.operation.deploymentId),
                'state.json'
            ),
            JSON.stringify({
                operation: {
                    ...deployment.operation,
                    leaseToken: undefined,
                    leaseExpiresAt: undefined,
                },
                ports: deployment.ports,
                attempt: deployment.attempt,
            })
        );
    }
    async recover(): Promise<Deployment[]> {
        await privateDirectory(this.config.WORKLOAD_SECRETS_DIR);
        const ids = new Set(
            (
                await this.run(
                    [
                        'ps',
                        '-a',
                        '--filter',
                        'label=org.learncard.workload.deployment',
                        '--format',
                        '{{.Label "org.learncard.workload.deployment"}}',
                    ],
                    5000
                )
            )
                .trim()
                .split('\n')
        );
        const result: Deployment[] = [];
        for (const name of await readdir(this.config.WORKLOAD_SECRETS_DIR)) {
            if (!name.startsWith('lcnwl-')) continue;
            try {
                const state = stateSchema.parse(
                    JSON.parse(
                        await readPrivate(
                            join(this.config.WORKLOAD_SECRETS_DIR, name, 'state.json')
                        )
                    )
                );
                if (
                    name !== projectName(state.operation.deploymentId) ||
                    !ids.has(state.operation.deploymentId)
                )
                    continue;
                await this.assertResolved(state.operation.deploymentId);
                const spec = parseSpec(state.operation.approvedSpec, this.config);
                const deployment: Deployment = {
                    ...state,
                    spec,
                    attempt: state.attempt,
                    completedInits: new Set<string>(),
                };
                result.push(deployment);
            } catch {
                this.redactor.log('RECOVERY_STATE_REJECTED');
            }
        }
        return result;
    }
}
