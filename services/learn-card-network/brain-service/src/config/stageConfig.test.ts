import { afterEach, expect, it, vi } from 'vitest';

vi.mock('dotenv/config', () => {
    vi.stubEnv('SENTRY_ENV', 'self-hosted');
    return {};
});

afterEach(() => vi.unstubAllEnvs());

it('loads local env before applying statically imported stage defaults', async () => {
    const { applyBrainServiceStageConfig, stages } = await import('./stageConfig');
    for (const key of Object.keys(stages.dev)) {
        if (key !== 'SENTRY_ENV') vi.stubEnv(key, '');
    }
    applyBrainServiceStageConfig('dev');
    expect(process.env.SENTRY_ENV).toBe('self-hosted');
    expect(process.env.DOMAIN_NAME).toBe(stages.dev.DOMAIN_NAME);
});

it('does not select a deployed stage for an unknown local stage', async () => {
    const { applyBrainServiceStageConfig } = await import('./stageConfig');
    vi.stubEnv('DOMAIN_NAME', '');
    applyBrainServiceStageConfig('unregistered-self-hosted-stage');
    expect(process.env.DOMAIN_NAME).toBe('');
});
