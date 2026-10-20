import { expect, it } from 'vitest';
import { createHealthProbe } from '../src/health';
import { AgentError } from '../src/redact';
import { parseSpec } from '../src/render';
import { config, operation } from './fixtures';

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
