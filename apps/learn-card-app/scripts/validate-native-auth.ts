#!/usr/bin/env bun

import { getLogger } from 'learn-card-base/src/logging/logger';
const log = getLogger();

/**
 * validate-native-auth.ts
 *
 * Cross-checks native Google/Apple sign-in + Keycloak native-client
 * requirements for every tenant config (base `config.json` + every stage
 * overlay). Only applies to configs whose merged `auth.provider` is
 * `'keycloak'` — Firebase-provider tenants/stages are skipped entirely.
 * Rule logic lives in `validateKeycloakNativeConfig()`
 * (native-auth-audiences.ts); this script is the filesystem walk + reporting
 * around it, matching the style of validate-tenant-configs.ts /
 * validate-theme-schemas.ts. Chained after both in `bun run lc validate`.
 *
 * Usage:
 *   bun scripts/validate-native-auth.ts
 *
 * Exit codes:
 *   0 — no errors (warnings allowed)
 *   1 — one or more errors
 */

import { readdirSync, existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { deepMerge } from 'learn-card-base/src/config/deepMerge';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/src/config/tenantDefaults';

import {
    deriveNativeAuthRequirements,
    validateKeycloakNativeConfig,
} from './native-auth-audiences';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const ENVIRONMENTS_DIR = resolve(APP_ROOT, 'environments');

const tenantDirs = readdirSync(ENVIRONMENTS_DIR).filter(name => {
    const full = join(ENVIRONMENTS_DIR, name);

    return statSync(full).isDirectory() && name !== 'local';
});

const discoverStageFiles = (tenantDir: string): string[] =>
    readdirSync(tenantDir)
        .filter(f => /^config\..+\.json$/.test(f))
        .map(f => f.replace(/^config\./, '').replace(/\.json$/, ''));

const getPath = (obj: unknown, path: string): unknown =>
    path
        .split('.')
        .reduce<unknown>(
            (o, key) =>
                o && typeof o === 'object' ? (o as Record<string, unknown>)[key] : undefined,
            obj
        );

let errors = 0;
let warnings = 0;
let checked = 0;

const checkOne = (
    label: string,
    tenantId: string,
    stageId: string | undefined,
    merged: Record<string, unknown>
): void => {
    const authProvider = getPath(merged, 'auth.provider') as string | undefined;

    if (authProvider !== 'keycloak') return;

    checked++;

    const requirements = deriveNativeAuthRequirements(tenantId, stageId, ENVIRONMENTS_DIR);

    const result = validateKeycloakNativeConfig(
        {
            tenantId,
            stageId,
            authProvider,
            bundleId: getPath(merged, 'native.bundleId') as string | undefined,
            keycloakServerUrl: getPath(merged, 'auth.keycloak.serverUrl') as string | undefined,
            keycloakRealm: getPath(merged, 'auth.keycloak.realm') as string | undefined,
            keycloakClientId: getPath(merged, 'auth.keycloak.clientId') as string | undefined,
            keycloakAuthBridgeUrl: getPath(merged, 'auth.keycloak.authBridgeUrl') as
                string | undefined,
        },
        requirements.googleClientIds
    );

    for (const err of result.errors) {
        log.error(`✗  ${label} — ${err}`);
    }

    for (const warning of result.warnings) {
        log.info(`⚠  ${label} — ${warning}`);
    }

    errors += result.errors.length;
    warnings += result.warnings.length;

    if (result.errors.length === 0) {
        log.info(`✓  ${label} — native Keycloak wiring OK`);
    }
};

for (const tenant of tenantDirs) {
    const tenantDir = join(ENVIRONMENTS_DIR, tenant);
    const configPath = join(tenantDir, 'config.json');

    if (!existsSync(configPath)) continue;

    let overrides: Record<string, unknown>;

    try {
        overrides = JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch {
        // Malformed JSON is already reported by validate-tenant-configs.ts,
        // which runs first in the `lc validate` chain.
        continue;
    }

    const baseMerged = deepMerge(
        DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
        overrides
    );

    checkOne(tenant, tenant, undefined, baseMerged);

    for (const stage of discoverStageFiles(tenantDir)) {
        const stagePath = join(tenantDir, `config.${stage}.json`);

        let stageOverrides: Record<string, unknown>;

        try {
            stageOverrides = JSON.parse(readFileSync(stagePath, 'utf-8'));
        } catch {
            continue;
        }

        const stageMerged = deepMerge(baseMerged, stageOverrides);

        checkOne(`${tenant}/${stage}`, tenant, stage, stageMerged);
    }
}

log.info('');

if (checked === 0) {
    log.info('ℹ️  No tenant configs use auth.provider "keycloak" — nothing to check.');
}

if (errors > 0) {
    log.error(`❌ ${errors} native-auth config error(s) found.`);
    process.exit(1);
}

if (warnings > 0) {
    log.info(`⚠️  ${warnings} native-auth warning(s) — see above.`);
}

log.info(`✅ Native auth wiring OK (${checked} keycloak config(s) checked).`);
