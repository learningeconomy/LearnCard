import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { open, readdir, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import type { AgentConfig } from './config';
import { AgentError, type Redactor } from './redact';
import { initialPort, parseSpec, portKey, projectName, render, type Spec } from './render';
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
}
const stateSchema = z.object({
    operation: operationSchema,
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
        public readonly run: Runner = runDocker
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
        const rendered = render(
            spec,
            operation.deploymentId,
            operation.specRevision,
            this.config,
            ports
        );
        await this.save(this.file(operation.deploymentId), rendered.yaml);
        return { operation, spec, ports };
    }
    async apply(deployment: Deployment, budget: () => number): Promise<void> {
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
                '--remove-orphans',
                '--pull',
                'never',
            ],
            Math.min(20000, budget())
        );
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
                result.push({ ...state, spec });
            } catch {
                this.redactor.log('RECOVERY_STATE_REJECTED');
            }
        }
        return result;
    }
}
