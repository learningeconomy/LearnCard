#!/usr/bin/env bun

import { getLogger } from 'learn-card-base/src/logging/logger';
const log = getLogger();

/**
 * generate-edge-tenant-configs.ts
 *
 * Scans `environments/` to auto-discover all tenants and their stage configs,
 * then writes a single JSON file that the Netlify edge functions can import.
 *
 * This replaces manual static imports in the edge function tenant-resolver —
 * adding a new tenant or stage just means adding config files under environments/.
 *
 * Output: netlify/edge-functions/shared/resolved-tenant-configs.generated.json
 *
 * Structure:
 *   {
 *     "registry": { ... tenant-registry.json ... },
 *     "pinnedStage": { "tenantId": "learncard", "stage": "keycloak-staging" } | null,
 *     "tenants": {
 *       "learncard": {
 *         "base": { ... config.json ... },
 *         "stages": {
 *           "local": { ... config.local.json ... },
 *           "staging": { ... config.staging.json ... }
 *         }
 *       },
 *       "vetpass": { ... }
 *     }
 *   }
 *
 * Usage:
 *   bun scripts/generate-edge-tenant-configs.ts [--tenant <tenant>] [--stage <stage>]
 *
 *   --stage pins that tenant's edge stage overlay to the one the build baked
 *   (prepare-native-config.ts --stage), instead of deriving it from the
 *   hostname. Without it, the stage comes from the hostname. --tenant names the
 *   tenant to pin (default "learncard") and is rejected without --stage.
 *
 * Run this before deploying or as part of the build command.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { resolve, dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

import type { PinnedStage } from '../netlify/edge-functions/shared/stage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');

const ENVIRONMENTS_DIR = join(APP_ROOT, 'environments');
const REGISTRY_PATH = join(ENVIRONMENTS_DIR, 'tenant-registry.json');
const OUTPUT_PATH = join(
    APP_ROOT,
    'netlify',
    'edge-functions',
    'shared',
    'resolved-tenant-configs.generated.json'
);

// ---------------------------------------------------------------------------
// Discover tenants and their configs
// ---------------------------------------------------------------------------

interface TenantConfigBundle {
    base: Record<string, unknown>;
    stages: Record<string, Record<string, unknown>>;
}

function discoverTenants(): Record<string, TenantConfigBundle> {
    const tenants: Record<string, TenantConfigBundle> = {};

    const entries = readdirSync(ENVIRONMENTS_DIR);

    for (const entry of entries) {
        const entryPath = join(ENVIRONMENTS_DIR, entry);

        // Skip files (like tenant-registry.json, README.md)
        if (!statSync(entryPath).isDirectory()) continue;

        const tenantId = entry;
        const baseConfigPath = join(entryPath, 'config.json');

        if (!existsSync(baseConfigPath)) {
            log.warn(`⚠ Skipping ${tenantId}: no config.json found`);
            continue;
        }

        const base = JSON.parse(readFileSync(baseConfigPath, 'utf-8'));
        const stages: Record<string, Record<string, unknown>> = {};

        // Find all config.<stage>.json files
        const files = readdirSync(entryPath);

        for (const file of files) {
            const match = file.match(/^config\.(.+)\.json$/);

            if (match && match[1]) {
                const stage = match[1];
                const stagePath = join(entryPath, file);
                stages[stage] = JSON.parse(readFileSync(stagePath, 'utf-8'));
            }
        }

        tenants[tenantId] = { base, stages };

        const stageNames = Object.keys(stages);
        log.info(
            `  ✓ ${tenantId}: base + ${stageNames.length} stage(s) [${stageNames.join(', ')}]`
        );
    }

    return tenants;
}

function readFlag(name: string): string | undefined {
    const args = process.argv.slice(2);
    const index = args.indexOf(`--${name}`);

    if (index === -1) return undefined;

    const value = args[index + 1];

    if (!value || value.startsWith('--')) {
        log.error(`✗ --${name} requires a value`);
        process.exit(1);
    }

    return value;
}

function resolvePinnedStage(tenants: Record<string, TenantConfigBundle>): PinnedStage | null {
    const stage = readFlag('stage');
    const tenantFlag = readFlag('tenant');

    if (!stage) {
        if (tenantFlag) {
            log.error('✗ --tenant only applies with --stage (it names the tenant to pin)');
            process.exit(1);
        }

        return null;
    }

    const tenantId = tenantFlag ?? 'learncard';

    if (!tenants[tenantId]?.stages[stage]) {
        log.error(`✗ --stage ${stage}: environments/${tenantId}/config.${stage}.json not found`);
        process.exit(1);
    }

    log.info(`  ⚑ ${tenantId}: edge stage pinned to "${stage}"`);

    return { tenantId, stage };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

log.info('Generating edge tenant configs...\n');

if (!existsSync(REGISTRY_PATH)) {
    log.error(`✗ tenant-registry.json not found at ${REGISTRY_PATH}`);
    process.exit(1);
}

const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
const tenants = discoverTenants();
const pinnedStage = resolvePinnedStage(tenants);

const output = {
    _generated: new Date().toISOString(),
    _comment: 'Auto-generated by scripts/generate-edge-tenant-configs.ts — do not edit manually.',
    registry,
    pinnedStage,
    tenants,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8');

log.info(`\n✓ Written to ${OUTPUT_PATH}`);
log.info(
    `  ${Object.keys(tenants).length} tenant(s), ${Object.values(tenants).reduce(
        (sum, t) => sum + Object.keys(t.stages).length,
        0
    )} total stage config(s)`
);
