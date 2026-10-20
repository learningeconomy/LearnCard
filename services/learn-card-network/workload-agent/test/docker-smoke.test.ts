import { expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
it.skipIf(process.env.WORKLOAD_AGENT_DOCKER_SMOKE !== '1')(
    'real Docker: digest-pinned HTTP health, retirement, volume retention',
    async (): Promise<void> => {
        await exec('docker', ['pull', 'hashicorp/http-echo:1.0.0'], { timeout: 90000 });
        const digest = (
            await exec('docker', [
                'inspect',
                '--format',
                '{{index .RepoDigests 0}}',
                'hashicorp/http-echo:1.0.0',
            ])
        ).stdout.trim();
        const image = digest.startsWith('docker.io/') ? digest : `docker.io/${digest}`;
        const result = await exec(
            'docker',
            [
                'run',
                '--rm',
                '--name',
                'lcn-workload-smoke-runner',
                '-v',
                '/var/run/docker.sock:/var/run/docker.sock',
                '-e',
                `WORKLOAD_SMOKE_IMAGE=${image}`,
                'lcn-workload-agent-local',
                'bun',
                '/app/test/smoke-runner.js',
            ],
            { timeout: 90000 }
        );
        expect(result.stdout).toContain('SMOKE_HEALTHY_RETIRED_VOLUME_RETAINED');
    },
    180000
);
