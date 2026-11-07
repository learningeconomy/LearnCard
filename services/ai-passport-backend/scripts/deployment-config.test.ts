import { expect, test } from 'bun:test';

const configurations = ['fly.toml', 'fly.mcp.toml'];

for (const file of configurations) {
    const configuration = Bun.TOML.parse(
        await Bun.file(new URL(`../${file}`, import.meta.url)).text()
    );

    test(`${file} stops idle Machines and can wake from zero`, () => {
        expect(configuration).toHaveProperty('http_service.auto_stop_machines', 'stop');
        expect(configuration).toHaveProperty('http_service.auto_start_machines', true);
        expect(configuration).toHaveProperty('http_service.min_machines_running', 0);
    });

    test(`${file} does not activate migration or change read/write routing on deployment`, () => {
        // Release configuration must not turn a completed backfill into read cutover
        // or new paid/admin authority. Existing live settings need separate review.
        for (const key of [
            'BEDROCK_EMBEDDINGS_ENABLED',
            'EMBEDDINGS_ADMIN_ENABLED',
            'EMBEDDINGS_DUAL_WRITE',
            'EMBEDDINGS_LAUNCHDARKLY_ENABLED',
            'EMBEDDINGS_READ_GENERATION',
            'EMBEDDINGS_WRITE_GENERATION',
        ]) {
            expect(configuration).not.toHaveProperty(`env.${key}`);
        }
    });
}
