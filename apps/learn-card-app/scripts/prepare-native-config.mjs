#!/usr/bin/env node

/**
 * prepare-native-config.mjs
 *
 * Generates `public/tenant-config.json` for native (Capacitor) builds.
 *
 * Usage:
 *   node scripts/prepare-native-config.mjs [tenant]
 *
 * Arguments:
 *   tenant  - The tenant identifier (default: "learncard").
 *             Maps to an environments/<tenant>.json file if it exists,
 *             otherwise falls back to the baked default config.
 *
 * Examples:
 *   node scripts/prepare-native-config.mjs              # default LearnCard
 *   node scripts/prepare-native-config.mjs scoutpass     # ScoutPass tenant
 *
 * The generated file is read by resolveTenantConfig() at runtime via
 * the `loadBakedConfig()` step (fetches /tenant-config.json).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');

const tenantArg = process.argv[2] ?? 'learncard';

// Try to load a tenant-specific override file from environments/
const envFilePath = resolve(APP_ROOT, 'environments', `${tenantArg}.json`);
let tenantOverrides = {};

if (existsSync(envFilePath)) {
    console.log(`📦 Loading tenant overrides from: environments/${tenantArg}.json`);
    tenantOverrides = JSON.parse(readFileSync(envFilePath, 'utf-8'));
} else {
    console.log(`ℹ️  No override file found at environments/${tenantArg}.json — using defaults.`);
}

// The output config includes a marker so the runtime knows this is a baked native config
const config = {
    _source: 'baked-native',
    _tenant: tenantArg,
    ...tenantOverrides,
};

// Write to public/ so Vite serves it at /tenant-config.json
const publicDir = resolve(APP_ROOT, 'public');

if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
}

const outPath = resolve(publicDir, 'tenant-config.json');

writeFileSync(outPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

console.log(`✅ Wrote tenant config to: ${outPath}`);
console.log(`   Tenant: ${tenantArg}`);
console.log(`   Keys: ${Object.keys(config).join(', ')}`);
