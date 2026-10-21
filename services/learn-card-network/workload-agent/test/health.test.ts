import { expect, it, vi } from 'vitest';
import { WorkloadEndpointDeclarationValidator } from '../../../../packages/learn-card-types/src/workload';
import { createHealthProbe } from '../src/health';
import { AgentError } from '../src/redact';
import { parseSpec } from '../src/render';
import { config, endpoint, operation } from './fixtures';

it.each([
    { readiness: undefined, status: 204, path: '/instance', healthy: true },
    { readiness: { path: '/' }, status: 200, path: '/', healthy: true },
    { readiness: { path: '/' }, status: 204, path: '/', healthy: false },
    {
        readiness: { path: '/healthz', expectStatus: 204 },
        status: 204,
        path: '/healthz',
        healthy: true,
    },
])(
    'probes $path with status $status without changing advertised URL',
    async ({ readiness, status, path, healthy }): Promise<void> => {
        const op = operation();
        const spec = parseSpec(op.approvedSpec, config());
        spec.endpoints[0] = { ...endpoint(), path: '/instance', readiness };
        spec.components[0]!.healthcheck = {
            kind: 'exec',
            argv: ['true'],
            timeoutMs: 1000,
            intervalMs: 100,
            startupDeadlineMs: 1000,
        };
        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(new Response(null, { status }));
        try {
            const probe = createHealthProbe(async (argv): Promise<string> => {
                if (argv[0] !== 'inspect') return '';
                return argv[2]!.startsWith('{{if')
                    ? 'true'
                    : JSON.stringify({ running: true, revision: '1', ip: '172.20.0.2' });
            }, 'agent');
            const result = await probe(
                { operation: op, spec, ports: { 'web:http': 23456 } },
                (): number => 20000
            );
            expect(fetchMock).toHaveBeenCalledWith(`http://172.20.0.2:5678${path}`, {
                method: 'GET',
                redirect: 'manual',
                signal: expect.any(AbortSignal),
            });
            expect(result.endpoints).toEqual([
                { id: 'web', url: 'http://127.0.0.1:23456/instance', healthy },
            ]);
        } finally {
            fetchMock.mockRestore();
        }
    }
);

it.each(['relative', '/../health', '/health?token=value', '//other', '/health#fragment'])(
    'rejects readiness path %s',
    (path): void => {
        expect(
            WorkloadEndpointDeclarationValidator.safeParse({ ...endpoint(), readiness: { path } })
                .success
        ).toBe(false);
    }
);

it.each([99, 600, 200.5])('rejects readiness status %s', (expectStatus): void => {
    expect(
        WorkloadEndpointDeclarationValidator.safeParse({
            ...endpoint(),
            readiness: { path: '/', expectStatus },
        }).success
    ).toBe(false);
});

it('recovers an existing probe attachment after a failed disconnect', async (): Promise<void> => {
    const op = operation();
    const spec = parseSpec(op.approvedSpec, config());
    spec.endpoints = [];
    spec.components[0]!.healthcheck = {
        kind: 'exec',
        argv: ['true'],
        timeoutMs: 1000,
        intervalMs: 100,
        startupDeadlineMs: 1000,
    };
    let firstDisconnect = true;
    const calls: string[][] = [];
    const probe = createHealthProbe(async (argv): Promise<string> => {
        calls.push(argv);
        if (argv[0] === 'inspect')
            return argv[2]!.startsWith('{{if')
                ? 'true'
                : JSON.stringify({ running: true, revision: '1', ip: '172.20.0.2' });
        if (argv[1] === 'disconnect' && firstDisconnect) {
            firstDisconnect = false;
            throw new AgentError('DOCKER_COMMAND_FAILED');
        }
        return '';
    }, 'agent');
    const deployment = { operation: op, spec, ports: {} };
    await expect(probe(deployment, (): number => 20000)).rejects.toThrow('DOCKER_COMMAND_FAILED');
    expect((await probe(deployment, (): number => 20000)).components[0]!.healthy).toBe(true);
    expect(calls.some((argv): boolean => argv[1] === 'connect')).toBe(false);
    expect(calls.filter((argv): boolean => argv[1] === 'disconnect')).toHaveLength(2);
});
