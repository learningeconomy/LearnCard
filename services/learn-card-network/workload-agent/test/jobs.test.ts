import { expect, it } from 'vitest';
import { Jobs } from '../src/jobs';
import { AgentError, Redactor } from '../src/redact';
import type { BrainClient, Observation } from '../src/types';
import type { Deployment, Driver } from '../src/compose-driver';
import { config, operation } from './fixtures';
import { parseSpec } from '../src/render';

const setup = (conflict = ''): { jobs: Jobs; calls: string[]; deployment: Deployment } => {
    const calls: string[] = [];
    const op = operation();
    const deployment: Deployment = {
        operation: op,
        spec: parseSpec(op.approvedSpec, config()),
        ports: {},
    };
    const record = (name: string): void => {
        calls.push(name);
        if (name === conflict) throw new AgentError('CONFLICT');
    };
    const brain: BrainClient = {
        list: async (): Promise<(typeof op)[]> => [op],
        claim: async (): Promise<typeof op> => {
            record('claim');
            return op;
        },
        observe: async (): Promise<void> => record('observe'),
        complete: async (_lease, status): Promise<void> => record(`complete:${status}`),
        health: async (): Promise<void> => record('health'),
    };
    const driver: Driver = {
        prepare: async (): Promise<Deployment> => {
            record('prepare');
            return deployment;
        },
        apply: async (): Promise<void> => record('apply'),
        retire: async (): Promise<void> => record('down'),
        recover: async (): Promise<Deployment[]> => [],
        remember: async (): Promise<void> => record('remember'),
    };
    const jobs = new Jobs(
        brain,
        driver,
        async (): Promise<Observation> => {
            record('probe');
            return {
                observedRevision: 1,
                components: [{ id: 'web', healthy: true }],
                endpoints: [],
            };
        },
        new Redactor()
    );
    return { jobs, calls, deployment };
};
it('claims, applies, observes and completes before ongoing health', async (): Promise<void> => {
    const { jobs, calls, deployment } = setup();
    await jobs.execute(deployment.operation);
    await jobs.health();
    expect(calls).toEqual([
        'claim',
        'prepare',
        'remember',
        'apply',
        'probe',
        'observe',
        'complete:SUCCEEDED',
        'probe',
        'health',
    ]);
});
it.each(['claim', 'observe', 'complete:SUCCEEDED'])(
    'abandons CONFLICT at %s without further Docker calls',
    async (stage): Promise<void> => {
        const { jobs, calls, deployment } = setup(stage);
        await jobs.execute(deployment.operation);
        await jobs.health();
        expect(calls.at(-1)).toBe(stage);
        expect(calls).not.toContain('complete:FAILED');
    }
);
it('fails early for insufficient lease budget without docker work', async (): Promise<void> => {
    const { jobs, calls, deployment } = setup();
    deployment.operation.leaseExpiresAt = new Date(Date.now() + 10000).toISOString();
    await jobs.execute(deployment.operation);
    expect(calls).toEqual(['claim', 'complete:FAILED']);
});
it('serializes same-deployment work', async (): Promise<void> => {
    const { jobs, calls, deployment } = setup();
    await Promise.all([jobs.execute(deployment.operation), jobs.execute(deployment.operation)]);
    expect(calls).toEqual([
        ...['claim', 'prepare', 'remember', 'apply', 'probe', 'observe', 'complete:SUCCEEDED'],
        ...['claim', 'prepare', 'remember', 'apply', 'probe', 'observe', 'complete:SUCCEEDED'],
    ]);
});
it('retires without observation and does not schedule further health', async (): Promise<void> => {
    const { jobs, calls, deployment } = setup();
    deployment.operation.action = 'RETIRE';
    await jobs.execute(deployment.operation);
    await jobs.health();
    expect(calls).toEqual(['claim', 'down', 'complete:SUCCEEDED']);
});
it('terminalizes a reclaimed operation without repeating Docker work', async (): Promise<void> => {
    const { jobs, calls, deployment } = setup();
    deployment.operation.attempts = 2;
    await jobs.execute(deployment.operation);
    expect(calls).toEqual(['claim', 'complete:FAILED']);
});
