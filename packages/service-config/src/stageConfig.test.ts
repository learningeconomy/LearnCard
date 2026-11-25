import { describe, expect, it } from 'vitest';

import { applyStageConfig, resolveStageDefaults, stageKey } from './stageConfig';

describe('resolveStageDefaults', () => {
    it('overlays the selected stage on top of base', () => {
        expect(
            resolveStageDefaults({
                base: { A: 'base-a', B: 'base-b' },
                stages: { dev: { B: 'dev-b', C: 'dev-c' } },
                stage: 'dev',
            })
        ).toEqual({ A: 'base-a', B: 'dev-b', C: 'dev-c' });
    });

    it('returns base alone when the stage is missing or unknown', () => {
        expect(resolveStageDefaults({ base: { A: 'base-a' }, stages: {}, stage: 'prod' })).toEqual({
            A: 'base-a',
        });
        expect(resolveStageDefaults({ base: { A: 'base-a' } })).toEqual({ A: 'base-a' });
    });

    it('drops empty-string base values entirely', () => {
        expect(resolveStageDefaults({ base: { A: 'base-a', B: '' } })).toEqual({ A: 'base-a' });
    });

    it('treats an empty stage value as unset, retaining the base value', () => {
        expect(
            resolveStageDefaults({
                base: { A: 'base-a', B: 'base-b' },
                stages: { dev: { A: '', C: 'dev-c' } },
                stage: 'dev',
            })
        ).toEqual({ A: 'base-a', B: 'base-b', C: 'dev-c' });
    });

    it('drops a key only when both layers are empty', () => {
        expect(
            resolveStageDefaults({
                base: { A: '', B: 'base-b' },
                stages: { dev: { A: '', B: '' } },
                stage: 'dev',
            })
        ).toEqual({ B: 'base-b' });
    });
});

describe('applyStageConfig', () => {
    it('writes only absent or empty env keys and preserves explicit values', () => {
        const env: Record<string, string | undefined> = { A: 'explicit', B: '', C: undefined };
        const result = applyStageConfig({
            base: { A: 'base-a', B: 'base-b', C: 'base-c', D: 'base-d' },
            env,
        });
        expect(env).toEqual({ A: 'explicit', B: 'base-b', C: 'base-c', D: 'base-d' });
        expect(result.stageDefaults).toEqual({
            A: 'base-a',
            B: 'base-b',
            C: 'base-c',
            D: 'base-d',
        });
    });

    it('applies stage precedence over base when filling env', () => {
        const env: Record<string, string | undefined> = {};
        applyStageConfig({
            base: { URL: 'base-url', REGION: 'base-region' },
            stages: { prod: { URL: 'prod-url' } },
            stage: 'prod',
            env,
        });
        expect(env).toEqual({ URL: 'prod-url', REGION: 'base-region' });
    });

    it('never fills a key whose default resolved to empty', () => {
        const env: Record<string, string | undefined> = {};
        applyStageConfig({ base: { A: '' }, stages: { dev: { A: '' } }, stage: 'dev', env });
        expect(env).toEqual({});
    });
});

describe('tenant selection', () => {
    const stages = {
        dev: { DOMAIN_NAME: 'staging.learncard' },
        'scouts.dev': { DOMAIN_NAME: 'staging.scouts' },
    };

    it('keys the default tenant by stage and other tenants by tenant.stage', () => {
        expect(stageKey('dev')).toBe('dev');
        expect(stageKey('dev', 'learncard')).toBe('dev');
        expect(stageKey('dev', 'scouts')).toBe('scouts.dev');
    });

    it('selects the tenant file from the option or CONFIG_TENANT', () => {
        expect(resolveStageDefaults({ stages, stage: 'dev', tenant: 'scouts', env: {} })).toEqual({
            DOMAIN_NAME: 'staging.scouts',
        });
        expect(
            resolveStageDefaults({ stages, stage: 'dev', env: { CONFIG_TENANT: 'scouts' } })
        ).toEqual({ DOMAIN_NAME: 'staging.scouts' });
        expect(resolveStageDefaults({ stages, stage: 'dev', env: {} })).toEqual({
            DOMAIN_NAME: 'staging.learncard',
        });
    });

    it('fails closed for a named tenant without a stage file', () => {
        expect(() =>
            resolveStageDefaults({ stages, stage: 'production', tenant: 'scouts', env: {} })
        ).toThrow('config.scouts.production.json');
    });

    it('keeps an unknown default-tenant stage on base config only', () => {
        expect(
            resolveStageDefaults({ base: { A: 'a' }, stages, stage: 'preview', env: {} })
        ).toEqual({ A: 'a' });
    });
});
