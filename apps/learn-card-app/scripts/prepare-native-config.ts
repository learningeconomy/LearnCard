#!/usr/bin/env npx tsx

/**
 * prepare-native-config.ts
 *
 * Generates `public/tenant-config.json` for native (Capacitor) builds.
 *
 * Usage:
 *   npx tsx scripts/prepare-native-config.ts [tenant] [--stage <stage>]
 *   npx tsx scripts/prepare-native-config.ts --reset
 *
 * Arguments:
 *   tenant  - The tenant identifier (default: "learncard").
 *             Maps to environments/<tenant>/config.json if it exists,
 *             otherwise falls back to the baked default config.
 *   --stage - Optional stage overlay (e.g. "local", "staging").
 *             Loads environments/<tenant>/config.<stage>.json on top
 *             of config.json via deepMerge. Only diffs need to be in
 *             the stage file.
 *   --reset - Undo all changes: restore git-tracked files and remove
 *             generated artifacts (public/branding/, tenant-config.json, etc.)
 *
 * Merge order:
 *   tenantDefaults → config.json → config.<stage>.json → final
 *
 * Examples:
 *   npx tsx scripts/prepare-native-config.ts                          # production learncard
 *   npx tsx scripts/prepare-native-config.ts vetpass                   # production vetpass
 *   npx tsx scripts/prepare-native-config.ts learncard --stage local   # local dev learncard
 *   npx tsx scripts/prepare-native-config.ts vetpass --stage staging   # staging vetpass
 *   npx tsx scripts/prepare-native-config.ts --reset                   # undo everything
 *
 * Backward compat:
 *   npx tsx scripts/prepare-native-config.ts local
 *   → treated as: learncard --stage local
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
import { deepMerge } from 'learn-card-base/src/config/deepMerge';
import type { TenantConfig } from 'learn-card-base/src/config/tenantConfigSchema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------

const KNOWN_STAGES = ['local', 'staging', 'production'] as const;
type Stage = (typeof KNOWN_STAGES)[number];

const parseArgs = (): { tenant: string; stage: Stage | undefined } => {
    const args = process.argv.slice(2);

    let tenant = 'learncard';
    let stage: Stage | undefined;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--stage' && args[i + 1]) {
            stage = args[i + 1] as Stage;
            i++; // skip the stage value
        } else if (args[i] === '--reset') {
            // handled below
            tenant = '--reset';
        } else if (!args[i]!.startsWith('--')) {
            tenant = args[i]!;
        }
    }

    // Backward compat: `prepare-native-config.ts local` → learncard --stage local
    // Only applies when there's no explicit --stage and the tenant name matches a known stage
    if (!stage && KNOWN_STAGES.includes(tenant as Stage) && tenant !== 'production') {
        console.log(`ℹ️  Interpreting "${tenant}" as: learncard --stage ${tenant}`);

        stage = tenant as Stage;
        tenant = 'learncard';
    }

    // "production" stage is the same as no stage (just config.json)
    if (stage === 'production') {
        stage = undefined;
    }

    return { tenant, stage };
};

const { tenant: tenantArg, stage: stageArg } = parseArgs();

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

        // Android — Firebase
        'android/app/google-services.json',

        // iOS — Firebase
        'ios/App/App/GoogleService-Info.plist',

        // Web
        'public/assets/icon/favicon.png',
        'public/assets/icon/icon.png',
        'public/assets/icon/icon-192.png',
        'public/assets/icon/apple-touch-icon.png',
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
        // Notification icons (density-qualified)
        removeTargets.push(`android/app/src/main/res/drawable-${d}/ic_stat_name.png`);
        removeTargets.push(`android/app/src/main/res/drawable-${d}/ic_action_name.png`);
    }

    removeTargets.push('android/app/src/main/res/drawable/splash.9.png');
    removeTargets.push('android/app/src/main/res/drawable/ic_launcher_background.xml');
    removeTargets.push('android/app/src/main/res/values/ic_launcher_background.xml');
    // Notification icons (default drawable)
    removeTargets.push('android/app/src/main/res/drawable/ic_notification.png');
    removeTargets.push('android/app/src/main/res/drawable/ic_stat_name.png');

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
// 1b. Load stage overlay from environments/<tenant>/config.<stage>.json
// ---------------------------------------------------------------------------

let stageOverrides: Record<string, unknown> = {};

if (stageArg) {
    const stageFilePath = resolve(APP_ROOT, 'environments', tenantArg, `config.${stageArg}.json`);

    if (existsSync(stageFilePath)) {
        console.log(`🔧 Loading stage overlay from: environments/${tenantArg}/config.${stageArg}.json`);
        stageOverrides = JSON.parse(readFileSync(stageFilePath, 'utf-8'));
    } else {
        console.log(`⚠️  No stage overlay at environments/${tenantArg}/config.${stageArg}.json — using base config only.`);
    }
}

// ---------------------------------------------------------------------------
// 2. Deep-merge: defaults → config.json → config.<stage>.json
// ---------------------------------------------------------------------------

const merged = deepMerge(
    deepMerge(
        DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
        tenantOverrides,
    ),
    stageOverrides,
);

// Add build metadata
merged['_source'] = 'baked-native';
merged['_tenant'] = tenantArg;
merged['_stage'] = stageArg ?? 'production';

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

        for (const webFile of ['favicon.png', 'icon.png', 'icon-192.png', 'apple-touch-icon.png']) {
            const src = join(webSrc, webFile);

            if (existsSync(src)) {
                cpSync(src, join(webIconDest, webFile));
                copiedCount++;
            }
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
//   text-logo-dark.* → branding.textLogoDarkUrl
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
    { prefix: 'text-logo-dark', configKey: 'textLogoDarkUrl' },
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

        // Ensure the 192×192 icon entry exists (required for Chrome "Add to Home Screen")
        const icons: Array<{ src: string; sizes: string; type: string; purpose?: string }> = raw.icons ?? [];
        const has192 = icons.some((i: { sizes: string }) => i.sizes.includes('192'));

        if (!has192) {
            icons.push({ src: 'assets/icon/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any' });
            raw.icons = icons;
        }

        writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
        console.log(`   ✓ Patched ${filePath} (name="${manifestName}", short_name="${manifestShortName}")`);
    } catch (err) {
        console.warn(`   ⚠️  Failed to patch ${filePath}:`, err);
    }
};

console.log('\n📋 Patching web manifests with tenant branding name...');
patchManifest(resolve(publicDir, 'manifest.json'));
patchManifest(resolve(publicDir, 'manifest.webmanifest'));

// ---------------------------------------------------------------------------
// 9. Copy Firebase config files (tenant-specific or learncard fallback)
// ---------------------------------------------------------------------------

const FIREBASE_CONFIG_MAP: Array<{ src: string; dest: string }> = [
    { src: 'config/google-services.json', dest: 'android/app/google-services.json' },
    { src: 'config/GoogleService-Info.plist', dest: 'ios/App/App/GoogleService-Info.plist' },
];

console.log('\n🔥 Copying Firebase config files...');

for (const { src, dest } of FIREBASE_CONFIG_MAP) {
    const fileName = src.replace('config/', '');
    let srcPath = join(configDir, fileName);

    if (!existsSync(srcPath)) {
        srcPath = join(fallbackConfigDir, fileName);
    }

    if (!existsSync(srcPath)) {
        console.log(`   ⚠️  No ${fileName} found — skipping.`);
        continue;
    }

    const destPath = resolve(APP_ROOT, dest);
    mkdirSync(dirname(destPath), { recursive: true });
    cpSync(srcPath, destPath);
    console.log(`   ✓ ${dest}`);
}

// ---------------------------------------------------------------------------
// 10. Patch iOS entitlements with tenant deep link domains
// ---------------------------------------------------------------------------

if (nativeConfig?.deepLinkDomains?.length) {
    console.log('\n🔗 Patching iOS entitlements with deep link domains...');

    const entitlementFiles = [
        'ios/App/App/App.entitlements',
        'ios/App/App/AppRelease.entitlements',
    ];

    const applinks = nativeConfig.deepLinkDomains.map((d: string) => `applinks:${d}`);

    for (const relPath of entitlementFiles) {
        const absPath = resolve(APP_ROOT, relPath);
        const templatePath = absPath + '.template';

        // Always start from the template so tenant switches produce a clean result
        if (existsSync(templatePath)) {
            cpSync(templatePath, absPath);
        }

        if (!existsSync(absPath)) continue;

        try {
            let content = readFileSync(absPath, 'utf-8');

            // Replace the associated-domains array content.
            // The entitlements plist has a structure like:
            //   <key>com.apple.developer.associated-domains</key>
            //   <array>
            //       <string>applinks:example.com</string>
            //   </array>
            const domainRegex = /(<key>com\.apple\.developer\.associated-domains<\/key>\s*<array>)([\s\S]*?)(<\/array>)/;
            const match = content.match(domainRegex);

            if (match) {
                const newEntries = applinks.map((link: string) => `\n\t\t<string>${link}</string>`).join('');
                content = content.replace(domainRegex, `$1${newEntries}\n\t$3`);

                writeFileSync(absPath, content, 'utf-8');
                console.log(`   ✓ Patched ${relPath} → [${applinks.join(', ')}]`);
            } else {
                console.log(`   ⚠️  No associated-domains key found in ${relPath} — skipping.`);
            }
        } catch (err) {
            console.warn(`   ⚠️  Failed to patch ${relPath}:`, err);
        }
    }
}

// ---------------------------------------------------------------------------
// 11. Patch index.html with tenant branding name + apple-touch-icon
// ---------------------------------------------------------------------------

const indexHtmlPath = resolve(APP_ROOT, 'index.html');
const indexTemplatePath = resolve(APP_ROOT, 'index.template.html');

// Always start from the template so tenant switches produce a clean result
if (existsSync(indexTemplatePath)) {
    cpSync(indexTemplatePath, indexHtmlPath);
}

if (existsSync(indexHtmlPath)) {
    console.log('\n📄 Patching index.html with tenant branding...');

    try {
        let html = readFileSync(indexHtmlPath, 'utf-8');

        // Patch <title>
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${manifestName}</title>`);

        // Patch apple-mobile-web-app-title
        html = html.replace(
            /(<meta\s+name="apple-mobile-web-app-title"\s+content=")[^"]*(")/,
            `$1${manifestShortName}$2`,
        );

        // Add apple-touch-icon link if missing
        if (!html.includes('apple-touch-icon')) {
            html = html.replace(
                /(<link rel="shortcut icon"[^>]*>)/,
                '$1\n        <link rel="apple-touch-icon" href="/assets/icon/apple-touch-icon.png" />',
            );
        }

        writeFileSync(indexHtmlPath, html, 'utf-8');
        console.log(`   ✓ <title>${manifestName}</title>`);
        console.log(`   ✓ apple-mobile-web-app-title="${manifestShortName}"`);
        console.log('   ✓ apple-touch-icon link');
    } catch (err) {
        console.warn('   ⚠️  Failed to patch index.html:', err);
    }
}
