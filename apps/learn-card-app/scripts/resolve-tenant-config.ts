#!/usr/bin/env npx tsx

import { getLogger } from 'learn-card-base/src/logging/logger';
const log = getLogger();

/**
 * resolve-tenant-config.ts
 *
 * Prints the final merged TenantConfig for a given tenant and optional stage.
 * Useful for debugging — see exactly what the app will receive after all
 * merge layers are applied.
 *
 * Usage:
 *   npx tsx scripts/resolve-tenant-config.ts [tenant] [--stage <stage>]
 *   pnpm lc resolve [tenant] [stage]
 *
 * Examples:
 *   pnpm lc resolve                        # learncard production
 *   pnpm lc resolve vetpass                 # vetpass production
 *   pnpm lc resolve vetpass alpha           # vetpass alpha stage
 *   pnpm lc resolve learncard local         # learncard local stage
 *
 * Merge order:
 *   tenantDefaults → config.json → config.<stage>.json → final
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { tenantConfigSchema } from 'learn-card-base/src/config/tenantConfigSchema';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/src/config/tenantDefaults';
import { deepMerge } from 'learn-card-base/src/config/deepMerge';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------

const KNOWN_STAGES = ['local', 'staging', 'production'] as const;
type Stage = (typeof KNOWN_STAGES)[number] | string;

const parseArgs = (): { tenant: string; stage: Stage | undefined } => {
    const args = process.argv.slice(2);

    let tenant = 'learncard';
    let stage: Stage | undefined;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--stage' && args[i + 1]) {
            stage = args[i + 1];
            i++;
        } else if (!args[i]!.startsWith('--')) {
            tenant = args[i]!;
        }
    }

    if (stage === 'production') {
        stage = undefined;
    }

    return { tenant, stage };
};

const { tenant, stage } = parseArgs();

// ---------------------------------------------------------------------------
// Resolve config (same merge logic as prepare-native-config.ts)
// ---------------------------------------------------------------------------

const bold = (s: string): string => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string): string => `\x1b[2m${s}\x1b[0m`;
const green = (s: string): string => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string): string => `\x1b[36m${s}\x1b[0m`;
const yellow = (s: string): string => `\x1b[33m${s}\x1b[0m`;

log.info('');
log.info(bold(`🔍 Resolving config: ${tenant}${stage ? ` (${stage})` : ' (production)'}`));
log.info('');

// Layer 1: defaults
log.info(
    `  ${green('1.')} ${dim('tenantDefaults.ts')} ${dim(
        '— packages/learn-card-base/src/config/tenantDefaults.ts'
    )}`
);
let merged: Record<string, unknown> = DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<
    string,
    unknown
>;

// Layer 2: config.json
const configPath = resolve(APP_ROOT, 'environments', tenant, 'config.json');

if (existsSync(configPath)) {
    const overrides = JSON.parse(readFileSync(configPath, 'utf-8'));

    merged = deepMerge(merged, overrides);
    log.info(
        `  ${green('2.')} ${cyan(`environments/${tenant}/config.json`)} ${dim(
            '— tenant overrides'
        )}`
    );
} else {
    log.info(`  ${yellow('2.')} ${dim(`environments/${tenant}/config.json — not found, skipped`)}`);
}

// Layer 3: config.<stage>.json
if (stage) {
    const stagePath = resolve(APP_ROOT, 'environments', tenant, `config.${stage}.json`);

    if (existsSync(stagePath)) {
        const stageOverrides = JSON.parse(readFileSync(stagePath, 'utf-8'));

        merged = deepMerge(merged, stageOverrides);
        log.info(
            `  ${green('3.')} ${cyan(`environments/${tenant}/config.${stage}.json`)} ${dim(
                '— stage overlay'
            )}`
        );
    } else {
        log.info(
            `  ${yellow('3.')} ${dim(
                `environments/${tenant}/config.${stage}.json — not found, skipped`
            )}`
        );
    }
} else {
    log.info(`  ${dim('3.')} ${dim('No stage overlay (production)')}`);
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

const validation = tenantConfigSchema.safeParse(merged);

log.info('');

if (validation.success) {
    log.info(green('✅ Schema validation passed'));
} else {
    log.info(yellow('⚠️  Schema validation issues:'));

    for (const issue of validation.error.issues) {
        log.info(`   ${issue.path.join('.')}: ${issue.message}`);
    }
}

// ---------------------------------------------------------------------------
// Print
// ---------------------------------------------------------------------------

// Strip the _defaults meta field if present
const output = { ...merged };
delete output['_defaults'];
delete output['_comment'];

log.info('');
log.info(bold('Final merged config:'));
log.info('');
log.info(JSON.stringify(output, null, 2));
log.info('');
