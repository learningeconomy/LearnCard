import { ComposeDriver, runDocker } from '../src/compose-driver';
import { createHealthProbe } from '../src/health';
import { Redactor } from '../src/redact';
import { projectName, safeName } from '../src/render';
import { config, operation, plan } from './fixtures';

export const smoke = async (): Promise<void> => {
    const image = process.env.WORKLOAD_SMOKE_IMAGE;
    if (!image || !/^docker.io\/hashicorp\/http-echo@sha256:[a-f0-9]{64}$/.test(image))
        throw new Error('SMOKE_IMAGE_REQUIRED');
    const settings = { ...config('/tmp/lcn-workload-smoke'), WORKLOAD_IMAGE_ALLOWLIST: image };
    const driver = new ComposeDriver(settings, new Redactor());
    const op = operation();
    op.deploymentId = `smoke-${Date.now()}`;
    const spec = plan();
    const arch = (await runDocker(['info', '--format', '{{.Architecture}}'], 5000)).trim();
    const platform = arch === 'arm64' || arch === 'aarch64' ? 'linux/arm64' : 'linux/amd64';
    spec.components[0]!.image = image;
    spec.components[0]!.platform = platform;
    spec.execution!.components[0]!.image = image;
    spec.execution!.components[0]!.platform = platform;
    op.approvedSpec = JSON.stringify(spec);
    const deadline = Date.now() + 45000;
    const budget = (): number => {
        const left = deadline - Date.now();
        if (left < 1000) throw new Error('SMOKE_TIMEOUT');
        return left;
    };
    process.stdout.write('SMOKE_PREPARE\n');
    const deployment = await driver.prepare(op, budget);
    const probe = createHealthProbe(runDocker, 'lcn-workload-smoke-runner');
    try {
        process.stdout.write('SMOKE_APPLY\n');
        await driver.apply(deployment, budget);
        let healthy = false;
        for (let attempt = 0; attempt < 10 && !healthy; attempt++) {
            process.stdout.write('SMOKE_PROBE\n');
            const observation = await probe(deployment, budget);
            healthy =
                observation.components.every((c): boolean => c.healthy) &&
                observation.endpoints.every((e): boolean => e.healthy);
            if (!healthy)
                await new Promise<void>((resolve): void => {
                    setTimeout(resolve, 500);
                });
        }
        if (!healthy) throw new Error('SMOKE_UNHEALTHY');
    } finally {
        await driver.retire({ ...op, action: 'RETIRE' }, (): number => 15000);
    }
    const volume = `${projectName(op.deploymentId)}-${safeName('data')}`;
    const retained = await runDocker(['volume', 'inspect', '--format', '{{.Name}}', volume], 5000);
    if (retained.trim() !== volume) throw new Error('SMOKE_VOLUME_LOST');
    process.stdout.write('SMOKE_HEALTHY_RETIRED_VOLUME_RETAINED\n');
};
void smoke().catch((error: unknown): void => {
    new Redactor().error(error);
    process.stderr.write('SMOKE_FAILED\n');
    process.exitCode = 1;
});
