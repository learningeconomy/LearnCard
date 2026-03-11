#!/usr/bin/env npx tsx

/**
 * prepare-native-config.ts
 *
 * Generates `public/tenant-config.json` for native (Capacitor) builds.
 *
 * Usage:
 *   npx tsx scripts/prepare-native-config.ts [tenant]
 *   npx tsx scripts/prepare-native-config.ts --reset
 *
 * Arguments:
 *   tenant  - The tenant identifier (default: "learncard").
 *             Maps to environments/<tenant>/config.json if it exists,
 *             otherwise falls back to the baked default config.
 *   --reset - Undo all changes: restore git-tracked files and remove
 *             generated artifacts (public/branding/, tenant-config.json, etc.)
 *
 * Examples:
 *   npx tsx scripts/prepare-native-config.ts              # default LearnCard
 *   npx tsx scripts/prepare-native-config.ts scoutpass     # ScoutPass tenant
 *   npx tsx scripts/prepare-native-config.ts --reset       # undo everything
 *
 * The generated file is read by resolveTenantConfig() at runtime via
 * the `loadBakedConfig()` step (fetches /tenant-config.json).
 *
 * The merged config is validated against the Zod schema at build time
 * so schema violations are caught before deploy, not at runtime.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, readdirSync, statSync, rmSync } from 'fs';
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
// 0. Handle --reset: undo all changes and exit
// ---------------------------------------------------------------------------

if (tenantArg === '--reset') {
    console.log('\n🔄 Cleaning all platform output files...\n');

    // All output paths that prepare-native-config.ts populates (gitignored).
    // These are removed so the next `prepare-native-config.ts <tenant>` starts clean.
    const removeTargets = [
        // iOS
        'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon.png',
        'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png',
        'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png',
        'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png',
        'ios/App/App/capacitor.config.json',
        'ios/App/App/tenant-deep-link-domains.json',

        // Android — capacitor config
        'android/app/src/main/assets/capacitor.config.json',

        // Web
        'public/assets/icon/favicon.png',
        'public/assets/icon/icon.png',
        'public/manifest.json',
        'public/manifest.webmanifest',
        'public/tenant-config.json',
        'public/branding',
    ];

    // Android icon + splash patterns (resolve dynamically)
    const densities = ['hdpi', 'ldpi', 'mdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

    for (const d of densities) {
        removeTargets.push(`android/app/src/main/res/mipmap-${d}/ic_launcher.webp`);
        removeTargets.push(`android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.webp`);
        removeTargets.push(`android/app/src/main/res/mipmap-${d}/ic_launcher_round.webp`);
        removeTargets.push(`android/app/src/main/res/drawable-${d}/splash.9.png`);
        removeTargets.push(`android/app/src/main/res/drawable-land-${d}/splash.9.png`);
        removeTargets.push(`android/app/src/main/res/drawable-port-${d}/splash.9.png`);
    }

    removeTargets.push('android/app/src/main/res/drawable/splash.9.png');
    removeTargets.push('android/app/src/main/res/drawable/ic_launcher_background.xml');
    removeTargets.push('android/app/src/main/res/values/ic_launcher_background.xml');

    let removed = 0;

    for (const relPath of removeTargets) {
        const absPath = resolve(APP_ROOT, relPath);

        if (existsSync(absPath)) {
            rmSync(absPath, { recursive: true, force: true });
            console.log(`   ✓ Removed ${relPath}`);
            removed++;
        }
    }

    if (removed === 0) {
        console.log('   Nothing to clean — already reset.');
    }

    console.log(`\n✅ Cleaned ${removed} file(s). To restore defaults, run:`);
    console.log('   npx tsx scripts/prepare-native-config.ts learncard\n');
    process.exit(0);
}

// ---------------------------------------------------------------------------
// 1. Load tenant-specific overrides from environments/<tenant>/config.json
// ---------------------------------------------------------------------------

const envFilePath = resolve(APP_ROOT, 'environments', tenantArg, 'config.json');
let tenantOverrides: Record<string, unknown> = {};

if (existsSync(envFilePath)) {
    console.log(`📦 Loading tenant overrides from: environments/${tenantArg}/config.json`);
    tenantOverrides = JSON.parse(readFileSync(envFilePath, 'utf-8'));
} else {
    console.log(`ℹ️  No override file found at environments/${tenantArg}/config.json — using defaults.`);
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

const publicDir = resolve(APP_ROOT, 'public');

if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// 4. Copy tenant-specific image assets (if they exist)
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

// ---------------------------------------------------------------------------
// 5. Copy in-app branding images and auto-set branding URL fields
// ---------------------------------------------------------------------------
//
// Convention: place tenant branding images in
//   environments/<tenant>/assets/branding/
//
// Supported filenames (any common image extension):
//   text-logo.*      → branding.textLogoUrl
//   brand-mark.*     → branding.brandMarkUrl
//   app-icon.*       → branding.appIconUrl
//   desktop-login-bg.*     → branding.desktopLoginBgUrl
//   desktop-login-bg-alt.* → branding.desktopLoginBgAltUrl
//
// Files are copied to public/branding/<filename> and the config field is
// auto-set to "/branding/<filename>" (relative URL) unless the tenant
// config already specifies an explicit URL for that field.

const BRANDING_FILE_MAP: Array<{ prefix: string; configKey: keyof typeof validatedConfig.branding }> = [
    { prefix: 'text-logo', configKey: 'textLogoUrl' },
    { prefix: 'brand-mark', configKey: 'brandMarkUrl' },
    { prefix: 'app-icon', configKey: 'appIconUrl' },
    { prefix: 'desktop-login-bg-alt', configKey: 'desktopLoginBgAltUrl' },
    { prefix: 'desktop-login-bg', configKey: 'desktopLoginBgUrl' },
];

const brandingDir = resolve(APP_ROOT, 'environments', tenantArg, 'assets', 'branding');

if (existsSync(brandingDir)) {
    console.log(`\n🎨 Processing in-app branding images from environments/${tenantArg}/assets/branding/...`);

    const brandingDest = resolve(publicDir, 'branding');
    mkdirSync(brandingDest, { recursive: true });

    const brandingFiles = readdirSync(brandingDir).filter(f => statSync(join(brandingDir, f)).isFile());

    let brandingCopied = 0;

    for (const { prefix, configKey } of BRANDING_FILE_MAP) {
        const match = brandingFiles.find(f => {
            const name = f.substring(0, f.lastIndexOf('.'));
            return name === prefix;
        });

        if (match) {
            cpSync(join(brandingDir, match), join(brandingDest, match));
            brandingCopied++;

            const currentValue = validatedConfig.branding[configKey];

            if (!currentValue) {
                (validatedConfig.branding as Record<string, unknown>)[configKey] = `/branding/${match}`;
                console.log(`   ✓ ${match} → branding.${configKey} = /branding/${match}`);
            } else {
                console.log(`   ✓ ${match} copied (branding.${configKey} already set to "${currentValue}")`);
            }
        }
    }

    if (brandingCopied === 0) {
        console.log('   No matching branding files found.');
    } else {
        console.log(`   Copied ${brandingCopied} branding image(s).`);
    }
} else {
    console.log(`\nℹ️  No branding images at environments/${tenantArg}/assets/branding/ — using bundled defaults.`);
}

// ---------------------------------------------------------------------------
// 5b. Copy base config templates (capacitor config, manifests)
//     These are gitignored, so we restore them from the tenant's assets/config/
//     (falling back to learncard defaults if the tenant doesn't supply them).
// ---------------------------------------------------------------------------

const CONFIG_TEMPLATE_MAP: Array<{ src: string; dests: string[] }> = [
    {
        src: 'config/capacitor.config.json',
        dests: [
            'ios/App/App/capacitor.config.json',
            'android/app/src/main/assets/capacitor.config.json',
        ],
    },
    { src: 'config/manifest.json', dests: ['public/manifest.json'] },
    { src: 'config/manifest.webmanifest', dests: ['public/manifest.webmanifest'] },
];

const configDir = resolve(APP_ROOT, 'environments', tenantArg, 'assets', 'config');
const fallbackConfigDir = resolve(APP_ROOT, 'environments', 'learncard', 'assets', 'config');

for (const { src, dests } of CONFIG_TEMPLATE_MAP) {
    let srcPath = join(configDir, src.replace('config/', ''));

    if (!existsSync(srcPath)) {
        srcPath = join(fallbackConfigDir, src.replace('config/', ''));
    }

    if (!existsSync(srcPath)) continue;

    for (const destRel of dests) {
        const destPath = resolve(APP_ROOT, destRel);
        mkdirSync(dirname(destPath), { recursive: true });
        cpSync(srcPath, destPath);
    }
}

// ---------------------------------------------------------------------------
// 6. Write final config to public/tenant-config.json
//    (after branding URL fields may have been auto-populated above)
// ---------------------------------------------------------------------------

const outPath = resolve(publicDir, 'tenant-config.json');

writeFileSync(outPath, JSON.stringify(validatedConfig, null, 2) + '\n', 'utf-8');

console.log(`\n✅ Wrote validated tenant config to: ${outPath}`);
console.log(`   Tenant: ${tenantArg}`);
console.log(`   Sections: ${Object.keys(validatedConfig).join(', ')}`);

// ---------------------------------------------------------------------------
// 7. Patch Capacitor native config JSON files with tenant values
// ---------------------------------------------------------------------------

const nativeConfig = validatedConfig.native;

if (nativeConfig) {
    console.log('\n⚙️  Patching Capacitor config with tenant native settings...');

    const patchCapacitorConfigJson = (jsonPath: string): void => {
        if (!existsSync(jsonPath)) return;

        try {
            const raw = JSON.parse(readFileSync(jsonPath, 'utf-8'));

            raw.appId = nativeConfig.bundleId;
            raw.appName = nativeConfig.displayName;

            if (raw.plugins?.CapacitorUpdater) {
                raw.plugins.CapacitorUpdater.appId = nativeConfig.bundleId;

                if (nativeConfig.capgoChannel) {
                    raw.plugins.CapacitorUpdater.defaultChannel = nativeConfig.capgoChannel;
                }
            }

            writeFileSync(jsonPath, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
            console.log(`   ✓ Patched ${jsonPath}`);
        } catch (err) {
            console.warn(`   ⚠️  Failed to patch ${jsonPath}:`, err);
        }
    };

    // Patch the native project capacitor config JSON files (generated by `npx cap sync`)
    patchCapacitorConfigJson(resolve(APP_ROOT, 'ios/App/App/capacitor.config.json'));
    patchCapacitorConfigJson(resolve(APP_ROOT, 'android/app/src/main/assets/capacitor.config.json'));

    // Also patch the iOS Info.plist deep link domains via a JSON sidecar
    // that the Fastlane/Xcode build can consume.
    const deepLinkDomainsPath = resolve(APP_ROOT, 'ios/App/App/tenant-deep-link-domains.json');

    writeFileSync(
        deepLinkDomainsPath,
        JSON.stringify({
            bundleId: nativeConfig.bundleId,
            displayName: nativeConfig.displayName,
            deepLinkDomains: nativeConfig.deepLinkDomains,
            customSchemes: nativeConfig.customSchemes ?? [],
        }, null, 2) + '\n',
        'utf-8',
    );

    console.log(`   ✓ Wrote deep link domains sidecar: ${deepLinkDomainsPath}`);
    console.log(`   Bundle ID: ${nativeConfig.bundleId}`);
    console.log(`   Display Name: ${nativeConfig.displayName}`);
    console.log(`   Deep Link Domains: ${nativeConfig.deepLinkDomains.join(', ')}`);
}

// ---------------------------------------------------------------------------
// 8. Patch manifest.json / manifest.webmanifest with tenant branding name
// ---------------------------------------------------------------------------

const manifestName = validatedConfig.branding.name;
const manifestShortName = validatedConfig.branding.shortName ?? manifestName;

const patchManifest = (filePath: string): void => {
    if (!existsSync(filePath)) return;

    try {
        const raw = JSON.parse(readFileSync(filePath, 'utf-8'));

        raw.name = manifestName;
        raw.short_name = manifestShortName;

        writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
        console.log(`   ✓ Patched ${filePath} (name="${manifestName}", short_name="${manifestShortName}")`);
    } catch (err) {
        console.warn(`   ⚠️  Failed to patch ${filePath}:`, err);
    }
};

console.log('\n📋 Patching web manifests with tenant branding name...');
patchManifest(resolve(publicDir, 'manifest.json'));
patchManifest(resolve(publicDir, 'manifest.webmanifest'));
