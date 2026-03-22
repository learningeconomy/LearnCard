#!/usr/bin/env npx tsx

/**
 * validate-tenant-configs.ts
 *
 * Validates every tenant config in environments/<tenant>/config.json (and any
 * config.<stage>.json stage overlays) against the Zod schema. Also detects
 * TODO_* sentinel placeholder values that haven't been filled in.
 *
 * Run this in CI to catch config drift before deploy.
 *
 * Usage:
 *   npx tsx scripts/validate-tenant-configs.ts
 *
 * Exit codes:
 *   0 — all configs valid
 *   1 — one or more configs invalid
 */

import { readdirSync, existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { tenantConfigSchema } from 'learn-card-base/src/config/tenantConfigSchema';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/src/config/tenantDefaults';
import { deepMerge } from 'learn-card-base/src/config/deepMerge';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const ENVIRONMENTS_DIR = resolve(APP_ROOT, 'environments');

// ---------------------------------------------------------------------------
// Discover tenants (skip legacy "local" dir — now learncard/config.local.json)
// ---------------------------------------------------------------------------

const tenantDirs = readdirSync(ENVIRONMENTS_DIR).filter(name => {
    const full = join(ENVIRONMENTS_DIR, name);

    return statSync(full).isDirectory() && name !== 'local';
});

if (tenantDirs.length === 0) {
    console.log('⚠  No tenant directories found in environments/');
    process.exit(0);
}

// ---------------------------------------------------------------------------
// TODO_* sentinel detection
// ---------------------------------------------------------------------------

const TODO_PATTERN = /^TODO_/;

const findTodoSentinels = (obj: unknown, path = ''): string[] => {
    const results: string[] = [];

    if (typeof obj === 'string' && TODO_PATTERN.test(obj)) {
        results.push(`${path} = "${obj}"`);
    } else if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            results.push(...findTodoSentinels(value, path ? `${path}.${key}` : key));
        }
    } else if (Array.isArray(obj)) {
        obj.forEach((item, i) => {
            results.push(...findTodoSentinels(item, `${path}[${i}]`));
        });
    }

    return results;
};

// ---------------------------------------------------------------------------
// Discover stage overlay files for a tenant
// ---------------------------------------------------------------------------

const discoverStageFiles = (tenantDir: string): string[] => {
    return readdirSync(tenantDir)
        .filter(f => /^config\..+\.json$/.test(f))
        .map(f => f.replace(/^config\./, '').replace(/\.json$/, ''));
};

// ---------------------------------------------------------------------------
// Validate a single config (base or merged with stage overlay)
// ---------------------------------------------------------------------------

let failures = 0;
let warnings = 0;

const validateConfig = (
    label: string,
    overrides: Record<string, unknown>,
    stageOverrides?: Record<string, unknown>,
): void => {
    let merged = deepMerge(
        DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
        overrides,
    );

    if (stageOverrides) {
        merged = deepMerge(merged, stageOverrides);
    }

    merged['_source'] = 'validation';

    const result = tenantConfigSchema.safeParse(merged);

    if (result.success) {
        const todos = findTodoSentinels(result.data);

        if (todos.length > 0) {
            console.log(`✓  ${label} — valid (${todos.length} TODO placeholder(s)):`);

            for (const t of todos) {
                console.log(`      ⚠  ${t}`);
            }

            warnings += todos.length;
        } else {
            console.log(`✓  ${label} — valid`);
        }
    } else {
        console.error(`✗  ${label} — INVALID:`);

        for (const issue of result.error.issues) {
            console.error(`      ${issue.path.join('.')}: ${issue.message}`);
        }

        failures++;
    }
};

// ---------------------------------------------------------------------------
// Validate each tenant (base config + stage overlays)
// ---------------------------------------------------------------------------

let totalConfigs = 0;

for (const tenant of tenantDirs) {
    const tenantDir = join(ENVIRONMENTS_DIR, tenant);
    const configPath = join(tenantDir, 'config.json');

    if (!existsSync(configPath)) {
        console.log(`⚠  ${tenant}/ — no config.json (assets-only tenant)`);
        continue;
    }

    try {
        const overrides = JSON.parse(readFileSync(configPath, 'utf-8'));

        // Validate base (production) config
        validateConfig(tenant, overrides);
        totalConfigs++;

        // Validate each stage overlay merged on top of base
        const stages = discoverStageFiles(tenantDir);

        for (const stage of stages) {
            const stagePath = join(tenantDir, `config.${stage}.json`);

            try {
                const stageOverrides = JSON.parse(readFileSync(stagePath, 'utf-8'));

                validateConfig(`${tenant}/${stage}`, overrides, stageOverrides);
                totalConfigs++;
            } catch (err) {
                console.error(`✗  ${tenant}/${stage} — failed to parse config.${stage}.json: ${err}`);
                failures++;
            }
        }
    } catch (err) {
        console.error(`✗  ${tenant} — failed to parse config.json: ${err}`);
        failures++;
    }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('');

if (failures > 0) {
    console.error(`❌ ${failures} config(s) failed validation out of ${totalConfigs} checked.`);
    process.exit(1);
}

if (warnings > 0) {
    console.log(`⚠️  ${warnings} TODO placeholder(s) found — fill these before deploying to production.`);
}

console.log(`✅ All ${totalConfigs} config(s) valid.`);
