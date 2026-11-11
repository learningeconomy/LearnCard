import { afterEach, expect, it, vi } from 'vitest';

// Model a non-empty .env value arriving before the stage defaults are applied.
vi.mock('dotenv/config', () => {
    vi.stubEnv('SENTRY_ENV', 'self-hosted');
    return {};
});

afterEach(() => vi.unstubAllEnvs());

it('loads local env before applying statically imported stage defaults', async () => {
    const { applyLearnCloudStageConfig, stages } = await import('./stageConfig');
    for (const key of Object.keys(stages.dev)) {
        if (key !== 'SENTRY_ENV') vi.stubEnv(key, '');
    }
    applyLearnCloudStageConfig('dev');
    expect(process.env.SENTRY_ENV).toBe('self-hosted');
    expect(process.env.SERVER_URL).toBe(stages.dev.SERVER_URL);
});

it('does not select a deployed stage for an unknown local stage', async () => {
    const { applyLearnCloudStageConfig } = await import('./stageConfig');
    vi.stubEnv('SERVER_URL', '');
    applyLearnCloudStageConfig('unregistered-self-hosted-stage');
    expect(process.env.SERVER_URL).toBe('');
});
