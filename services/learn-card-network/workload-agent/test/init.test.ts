import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { ComposeDriver, type Deployment } from '../src/compose-driver';
import { config, operation } from './fixtures';
import { parseSpec, projectName, safeName } from '../src/render';
import { privateDirectory } from '../src/secrets';
import { AgentError, Redactor } from '../src/redact';

it.each(['success', 'nonzero', 'signal', 'stale', 'start-failure', 'timeout'] as const)(
    'gates dependent startup on current-attempt init exit: %s',
    async (outcome): Promise<void> => {
        const root = await mkdtemp(join(tmpdir(), 'lcn-init-'));
        const op = operation();
        const spec = parseSpec(op.approvedSpec, config(root));
        const service = spec.components[0]!;
        const init = {
            ...service,
            id: 'init',
            user: '999:999',
            command: ['node', '-e', 'process.exit(0)'],
            lifecycle: { kind: 'init' as const, timeoutMs: 1000 },
            ports: [],
            volumes: [],
            env: [],
            dependsOn: [],
        };
        delete init.healthcheck;
        service.dependsOn = ['init'];
        spec.components.push(init);
        const deployment: Deployment = { operation: op, spec, ports: {}, attempt: 'current' };
        const starts: string[] = [];
        const events: string[] = [];
        try {
            await privateDirectory(join(root, projectName(op.deploymentId)));
            const driver = new ComposeDriver(
                config(root),
                new Redactor(),
                async (argv): Promise<string> => {
                    if (argv[0] === 'kill') events.push('kill');
                    if (argv.includes('up')) {
                        expect(argv).toContain('--no-deps');
                        const name = argv[argv.length - 1]!;
                        starts.push(name);
                        events.push(`start:${name}`);
                        if (outcome === 'start-failure')
                            throw new AgentError('DOCKER_COMMAND_FAILED');
                    }
                    if (argv[0] === 'inspect') {
                        events.push('init-exit');
                        return JSON.stringify([
                            {
                                Id: 'a'.repeat(64),
                                State: {
                                    Status: outcome === 'timeout' ? 'running' : 'exited',
                                    ExitCode:
                                        outcome === 'nonzero' ? 1 : outcome === 'signal' ? 137 : 0,
                                    OOMKilled: false,
                                },
                                Config: {
                                    Labels: {
                                        'org.learncard.workload.deployment': op.deploymentId,
                                        'org.learncard.workload.revision': String(op.specRevision),
                                        'org.learncard.workload.component': 'init',
                                        'org.learncard.workload.attempt':
                                            outcome === 'stale' ? 'previous' : 'current',
                                    },
                                },
                            },
                        ]);
                    }
                    return '';
                },
                async (
                    partial
                ): Promise<{
                    observedRevision: number;
                    components: { id: string; healthy: boolean }[];
                    endpoints: [];
                }> => ({
                    observedRevision: op.specRevision,
                    components: partial.spec.components.map(
                        (component): { id: string; healthy: boolean } => ({
                            id: component.id,
                            healthy: true,
                        })
                    ),
                    endpoints: [],
                })
            );
            if (outcome === 'success') {
                await driver.apply(deployment, (): number => 20000);
                expect(starts).toEqual([safeName('init'), safeName('web')]);
                expect(events.indexOf('init-exit')).toBeLessThan(
                    events.indexOf(`start:${safeName('web')}`)
                );
                expect(deployment.completedInits?.has('init')).toBe(true);
            } else {
                await expect(driver.apply(deployment, (): number => 20000)).rejects.toThrow(
                    outcome === 'timeout'
                        ? 'INIT_TIMEOUT'
                        : outcome === 'stale' || outcome === 'start-failure'
                          ? 'INIT_START_FAILED'
                          : 'INIT_FAILED'
                );
                if (outcome === 'timeout') expect(events).toContain('kill');
                expect(starts).toEqual([safeName('init')]);
                expect(deployment.completedInits?.has('init')).toBe(false);
            }
        } finally {
            await rm(root, { recursive: true, force: true });
        }
    }
);
