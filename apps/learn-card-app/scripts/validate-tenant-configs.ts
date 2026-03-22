#!/usr/bin/env npx tsx

/**
 * validate-tenant-configs.ts
 *
 * Validates every tenant config in environments/<tenant>/config.json against
 * the Zod schema. Run this in CI to catch config drift before deploy.
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const ENVIRONMENTS_DIR = resolve(APP_ROOT, 'environments');

// ---------------------------------------------------------------------------
// Deep merge (same logic as prepare-native-config.ts)
// ---------------------------------------------------------------------------

const deepMerge = (base: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> => {
    const result = { ...base };

    for (const key of Object.keys(overrides)) {
        const baseVal = base[key];
        const overrideVal = overrides[key];

        if (
            baseVal && overrideVal &&
            typeof baseVal === 'object' && !Array.isArray(baseVal) &&
            typeof overrideVal === 'object' && !Array.isArray(overrideVal)
        ) {
            result[key] = deepMerge(
                baseVal as Record<string, unknown>,
                overrideVal as Record<string, unknown>,
            );
        } else {
            result[key] = overrideVal;
        }
    }

    return result;
};

// ---------------------------------------------------------------------------
// Discover tenants
// ---------------------------------------------------------------------------

const tenantDirs = readdirSync(ENVIRONMENTS_DIR).filter(name => {
    const full = join(ENVIRONMENTS_DIR, name);

    return statSync(full).isDirectory();
});

if (tenantDirs.length === 0) {
    console.log('⚠  No tenant directories found in environments/');
    process.exit(0);
}

// ---------------------------------------------------------------------------
// Validate each tenant
// ---------------------------------------------------------------------------

let failures = 0;

for (const tenant of tenantDirs) {
    const configPath = join(ENVIRONMENTS_DIR, tenant, 'config.json');

    if (!existsSync(configPath)) {
        console.log(`⚠  ${tenant}/ — no config.json (assets-only tenant)`);
        continue;
    }

    try {
        const overrides = JSON.parse(readFileSync(configPath, 'utf-8'));

        const merged = deepMerge(
            DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
            overrides,
        );

        merged['_source'] = 'validation';
        merged['_tenant'] = tenant;

        const result = tenantConfigSchema.safeParse(merged);

        if (result.success) {
            console.log(`✓  ${tenant} — valid (tenantId=${result.data.tenantId})`);
        } else {
            console.error(`✗  ${tenant} — INVALID:`);

            for (const issue of result.error.issues) {
                console.error(`      ${issue.path.join('.')}: ${issue.message}`);
            }

            failures++;
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
    console.error(`❌ ${failures} tenant config(s) failed validation.`);
    process.exit(1);
} else {
    console.log(`✅ All ${tenantDirs.length} tenant config(s) valid.`);
}
