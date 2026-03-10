#!/usr/bin/env npx tsx

/**
 * prepare-native-config.ts
 *
 * Generates `public/tenant-config.json` for native (Capacitor) builds.
 *
 * Usage:
 *   npx tsx scripts/prepare-native-config.ts [tenant]
 *
 * Arguments:
 *   tenant  - The tenant identifier (default: "learncard").
 *             Maps to an environments/<tenant>.json file if it exists,
 *             otherwise falls back to the baked default config.
 *
 * Examples:
 *   npx tsx scripts/prepare-native-config.ts              # default LearnCard
 *   npx tsx scripts/prepare-native-config.ts scoutpass     # ScoutPass tenant
 *
 * The generated file is read by resolveTenantConfig() at runtime via
 * the `loadBakedConfig()` step (fetches /tenant-config.json).
 *
 * The merged config is validated against the Zod schema at build time
 * so schema violations are caught before deploy, not at runtime.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { tenantConfigSchema } from 'learn-card-base/src/config/tenantConfigSchema';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/src/config/tenantDefaults';
import type { TenantConfig } from 'learn-card-base/src/config/tenantConfigSchema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');

const tenantArg = process.argv[2] ?? 'learncard';

// ---------------------------------------------------------------------------
// 1. Load tenant-specific overrides from environments/<tenant>.json
// ---------------------------------------------------------------------------

const envFilePath = resolve(APP_ROOT, 'environments', `${tenantArg}.json`);
let tenantOverrides: Record<string, unknown> = {};

if (existsSync(envFilePath)) {
    console.log(`📦 Loading tenant overrides from: environments/${tenantArg}.json`);
    tenantOverrides = JSON.parse(readFileSync(envFilePath, 'utf-8'));
} else {
    console.log(`ℹ️  No override file found at environments/${tenantArg}.json — using defaults.`);
}

// ---------------------------------------------------------------------------
// 2. Deep-merge overrides onto defaults
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

const merged = deepMerge(
    DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
    tenantOverrides,
);

// Add build metadata
merged['_source'] = 'baked-native';
merged['_tenant'] = tenantArg;

// ---------------------------------------------------------------------------
// 3. Validate against the Zod schema
// ---------------------------------------------------------------------------

const validation = tenantConfigSchema.safeParse(merged);

if (!validation.success) {
    console.error('\n❌ Merged tenant config failed schema validation:\n');

    for (const issue of validation.error.issues) {
        console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    }

    console.error('\nFix the environment file or update the schema, then re-run.\n');
    process.exit(1);
}

const validatedConfig: TenantConfig = validation.data;

// ---------------------------------------------------------------------------
// 4. Write to public/tenant-config.json
// ---------------------------------------------------------------------------

const publicDir = resolve(APP_ROOT, 'public');

if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
}

const outPath = resolve(publicDir, 'tenant-config.json');

writeFileSync(outPath, JSON.stringify(validatedConfig, null, 2) + '\n', 'utf-8');

console.log(`\n✅ Wrote validated tenant config to: ${outPath}`);
console.log(`   Tenant: ${tenantArg}`);
console.log(`   Sections: ${Object.keys(validatedConfig).join(', ')}`);

// ---------------------------------------------------------------------------
// 5. Copy tenant-specific image assets (if they exist)
// ---------------------------------------------------------------------------

const assetsDir = resolve(APP_ROOT, 'environments', tenantArg, 'assets');

if (existsSync(assetsDir)) {
    console.log(`\n📸 Copying tenant assets from environments/${tenantArg}/assets/...`);

    let copiedCount = 0;

    const copyRecursive = (src: string, dest: string): void => {
        for (const entry of readdirSync(src, { withFileTypes: true })) {
            const srcPath = join(src, entry.name);
            const destPath = join(dest, entry.name);

            if (entry.isDirectory()) {
                mkdirSync(destPath, { recursive: true });
                copyRecursive(srcPath, destPath);
            } else {
                cpSync(srcPath, destPath);
                copiedCount++;
            }
        }
    };

    // iOS assets → ios/App/App/Assets.xcassets/
    const iosSrc = join(assetsDir, 'ios');

    if (existsSync(iosSrc)) {
        const iosAppIconDest = resolve(APP_ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
        const iosSplashDest = resolve(APP_ROOT, 'ios/App/App/Assets.xcassets/Splash.imageset');

        const appIconSrc = join(iosSrc, 'AppIcon.png');

        if (existsSync(appIconSrc)) {
            mkdirSync(iosAppIconDest, { recursive: true });
            cpSync(appIconSrc, join(iosAppIconDest, 'AppIcon.png'));
            copiedCount++;
        }

        for (const splashFile of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
            const src = join(iosSrc, splashFile);

            if (existsSync(src)) {
                mkdirSync(iosSplashDest, { recursive: true });
                cpSync(src, join(iosSplashDest, splashFile));
                copiedCount++;
            }
        }

        console.log('   ✓ iOS assets');
    }

    // Android assets → android/app/src/main/res/
    const androidSrc = join(assetsDir, 'android');

    if (existsSync(androidSrc)) {
        const androidResDest = resolve(APP_ROOT, 'android/app/src/main/res');
        copyRecursive(androidSrc, androidResDest);
        console.log('   ✓ Android assets');
    }

    // Web assets → public/assets/icon/
    const webSrc = join(assetsDir, 'web');

    if (existsSync(webSrc)) {
        const webIconDest = resolve(APP_ROOT, 'public/assets/icon');
        mkdirSync(webIconDest, { recursive: true });

        const faviconSrc = join(webSrc, 'favicon.png');
        const iconSrc = join(webSrc, 'icon.png');

        if (existsSync(faviconSrc)) {
            cpSync(faviconSrc, join(webIconDest, 'favicon.png'));
            copiedCount++;
        }

        if (existsSync(iconSrc)) {
            cpSync(iconSrc, join(webIconDest, 'icon.png'));
            copiedCount++;
        }

        console.log('   ✓ Web assets');
    }

    console.log(`   Copied ${copiedCount} asset files.`);
} else {
    console.log(`\nℹ️  No tenant assets found at environments/${tenantArg}/assets/ — skipping asset copy.`);
}
