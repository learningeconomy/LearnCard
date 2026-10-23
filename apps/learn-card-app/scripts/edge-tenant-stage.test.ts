/**
 * Run with: bun test scripts/edge-tenant-stage.test.ts (cwd: apps/learn-card-app).
 * Not under src/, so it's outside vitest.config.ts's `include` — uses Bun's runner.
 */
import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

import { getStageFromHostname, selectStage } from '../netlify/edge-functions/shared/stage';

const APP_ROOT = join(import.meta.dir, '..');
const GENERATED = join(
    APP_ROOT,
    'netlify/edge-functions/shared/resolved-tenant-configs.generated.json'
);

const generate = (...args: string[]) =>
    spawnSync('bun', ['scripts/generate-edge-tenant-configs.ts', ...args], {
        cwd: APP_ROOT,
        encoding: 'utf-8',
    });

const readPinnedStage = (): unknown => JSON.parse(readFileSync(GENERATED, 'utf-8')).pinnedStage;

describe('selectStage', () => {
    const pinned = { tenantId: 'learncard', stage: 'keycloak-staging' };

    test('falls back to the hostname without a pin', () => {
        expect(selectStage('staging.learncard.ai', 'learncard', null)).toBe('staging');
        expect(selectStage('learncard.app', 'learncard', null)).toBeNull();
        expect(selectStage('localhost', 'learncard', null)).toBe('local');
    });

    test('a pin wins for its own tenant on every hostname', () => {
        expect(selectStage('staging.learncard.ai', 'learncard', pinned)).toBe('keycloak-staging');
        expect(selectStage('main--site.netlify.app', 'learncard', pinned)).toBe('keycloak-staging');
    });

    test('a pin never leaks into another tenant', () => {
        expect(selectStage('alpha.vetpass.app', 'vetpass', pinned)).toBe('alpha');
    });

    test('getStageFromHostname keeps its existing contract', () => {
        expect(getStageFromHostname('www.learncard.app')).toBeNull();
        expect(getStageFromHostname('127.0.0.1')).toBe('local');
    });
});

// Sequential: each case rewrites the gitignored generated bundle.
describe('generate-edge-tenant-configs', () => {
    test('records no pin by default', () => {
        expect(generate().status).toBe(0);
        expect(readPinnedStage()).toBeNull();
    });

    test('rejects a stage with no config file', () => {
        const result = generate('--tenant', 'learncard', '--stage', 'does-not-exist');

        expect(result.status).toBe(1);
        expect(readPinnedStage()).toBeNull();
    });

    test('rejects a flag without a value', () => {
        expect(generate('--stage').status).toBe(1);
    });

    test('rejects --tenant without --stage', () => {
        expect(generate('--tenant', 'vetpass').status).toBe(1);
    });

    test('pinned keycloak-staging makes staging.learncard.ai serve Keycloak', async () => {
        expect(generate('--tenant', 'learncard', '--stage', 'keycloak-staging').status).toBe(0);
        expect(readPinnedStage()).toEqual({ tenantId: 'learncard', stage: 'keycloak-staging' });

        const { resolveTenantConfig } = await import(
            `../netlify/edge-functions/shared/tenant-resolver.ts?pinned=${Date.now()}`
        );
        const config = resolveTenantConfig('staging.learncard.ai') as {
            domain: string;
            stage: string;
            auth: { provider: string; keyDerivation: string };
        };

        expect(config.domain).toBe('staging.learncard.ai');
        expect(config.stage).toBe('staging');
        expect(config.auth.provider).toBe('keycloak');
        expect(config.auth.keyDerivation).toBe('sss');
        const vetpassAlpha = resolveTenantConfig('alpha.vetpass.app') as {
            tenantId: string;
            stage: string;
        };
        expect(vetpassAlpha.tenantId).toBe('vetpass');
        expect(vetpassAlpha.stage).toBe('staging');

        expect(generate().status).toBe(0);
    });

    test('bundles each overlay with its declared deploy stage', () => {
        expect(generate().status).toBe(0);
        const { tenants } = JSON.parse(readFileSync(GENERATED, 'utf-8'));
        const learncard = tenants.learncard;

        // The edge resolver deep-merges these overlays onto base, so the served config carries them.
        expect(learncard.stages.staging.stage).toBe('staging');
        expect(learncard.stages['keycloak-staging'].stage).toBe('staging');
        expect(learncard.stages.local.stage).toBe('local');
        // Production carries no overlay; the client schema defaults `stage` to 'production'.
        expect(learncard.base.stage).toBeUndefined();
    });
});

// Every overlay must name its deploy stage: prepare-native-config rejects free-form overlay
// names (e.g. keycloak-staging) that don't, and the edge serves the same declaration.
describe('stage overlays', () => {
    test('declare a valid deploy stage', () => {
        const envRoot = join(APP_ROOT, 'environments');
        const invalid: string[] = [];
        let checked = 0;
        for (const tenant of readdirSync(envRoot)) {
            if (!existsSync(join(envRoot, tenant, 'config.json'))) continue;
            for (const file of readdirSync(join(envRoot, tenant))) {
                if (!/^config\..+\.json$/.test(file)) continue;
                checked++;
                const { stage } = JSON.parse(readFileSync(join(envRoot, tenant, file), 'utf-8'));
                if (!['local', 'staging', 'production'].includes(stage)) {
                    invalid.push(`${tenant}/${file}: ${JSON.stringify(stage)}`);
                }
            }
        }
        expect(checked).toBeGreaterThan(0);
        expect(invalid).toEqual([]);
    });
});
