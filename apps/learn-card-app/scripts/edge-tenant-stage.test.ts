/**
 * Run with: bun test scripts/edge-tenant-stage.test.ts (cwd: apps/learn-card-app).
 * Not under src/, so it's outside vitest.config.ts's `include` — uses Bun's runner.
 */
import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
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

    test('pinned keycloak-staging makes staging.learncard.ai serve Keycloak', async () => {
        expect(generate('--tenant', 'learncard', '--stage', 'keycloak-staging').status).toBe(0);
        expect(readPinnedStage()).toEqual({ tenantId: 'learncard', stage: 'keycloak-staging' });

        const { resolveTenantConfig } = await import(
            `../netlify/edge-functions/shared/tenant-resolver.ts?pinned=${Date.now()}`
        );
        const config = resolveTenantConfig('staging.learncard.ai') as {
            domain: string;
            auth: { provider: string; keyDerivation: string };
        };

        expect(config.domain).toBe('staging.learncard.ai');
        expect(config.auth.provider).toBe('keycloak');
        expect(config.auth.keyDerivation).toBe('sss');
        expect((resolveTenantConfig('alpha.vetpass.app') as { tenantId: string }).tenantId).toBe(
            'vetpass'
        );

        expect(generate().status).toBe(0);
    });
});
