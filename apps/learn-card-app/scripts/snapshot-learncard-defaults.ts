#!/usr/bin/env npx tsx

/**
 * snapshot-learncard-defaults.ts
 *
 * ONE-TIME migration script.
 *
 * Copies the original git-committed LearnCard platform assets into
 * environments/learncard/assets/ so they follow the same structure as
 * any other tenant.  After running this:
 *
 *   1. The gitignore entries (added separately) prevent platform output
 *      files from showing up in `git status`.
 *   2. `npx tsx scripts/prepare-native-config.ts learncard` restores
 *      the default LearnCard assets from environments/learncard/assets/.
 *   3. Switching tenants is just: prepare-native-config.ts <tenant>
 *   4. Switching back is just:    prepare-native-config.ts learncard
 *
 * Usage:
 *   npx tsx scripts/snapshot-learncard-defaults.ts
 */

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const GIT_ROOT = resolve(APP_ROOT, '../..');

const OUT = resolve(APP_ROOT, 'environments/learncard/assets');

// Relative to git root — used with `git show HEAD:<path>`
const APP_PREFIX = 'apps/learn-card-app';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ensureDir = (dir: string): void => {
    mkdirSync(dir, { recursive: true });
};

/**
 * Extract a file from git HEAD (the last committed version) so we always
 * get the original LearnCard asset even if the working tree has been
 * overwritten by a tenant switch.
 */
const extractFromGit = (relPath: string, destPath: string): boolean => {
    const gitPath = `${APP_PREFIX}/${relPath}`;

    try {
        const buf = execSync(`git show HEAD:${gitPath}`, {
            cwd: GIT_ROOT,
            encoding: 'buffer',
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        ensureDir(dirname(destPath));
        writeFileSync(destPath, buf);

        return true;
    } catch {
        return false;
    }
};

/**
 * Copy a file from the source tree (not from git — these are always
 * tracked and not overwritten by prepare-native-config).
 */
const copyFromSrc = (srcRel: string, destPath: string): boolean => {
    const src = resolve(APP_ROOT, srcRel);

    if (!existsSync(src)) return false;

    ensureDir(dirname(destPath));
    copyFileSync(src, destPath);

    return true;
};

// ---------------------------------------------------------------------------
// iOS assets
// ---------------------------------------------------------------------------

console.log('\n📸 Snapshotting LearnCard default assets...\n');

let count = 0;

const iosFiles = [
    'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon.png',
    'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png',
    'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png',
    'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png',
];

for (const rel of iosFiles) {
    const filename = rel.split('/').pop()!;
    const dest = join(OUT, 'ios', filename);

    if (extractFromGit(rel, dest)) {
        console.log(`   ✓ ios/${filename}`);
        count++;
    } else {
        console.warn(`   ⚠ ios/${filename} — not found in git HEAD`);
    }
}

// ---------------------------------------------------------------------------
// Android assets
// ---------------------------------------------------------------------------

const ANDROID_RES = 'android/app/src/main/res';

const MIPMAP_DENSITIES = ['hdpi', 'mdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

const SPLASH_DIRS = [
    'drawable',
    ...['hdpi', 'ldpi', 'mdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].map(d => `drawable-${d}`),
    ...['hdpi', 'ldpi', 'mdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].map(d => `drawable-land-${d}`),
    ...['hdpi', 'ldpi', 'mdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].map(d => `drawable-port-${d}`),
];

// Mipmap icons
for (const density of MIPMAP_DENSITIES) {
    for (const file of ['ic_launcher.webp', 'ic_launcher_foreground.webp', 'ic_launcher_round.webp']) {
        const rel = `${ANDROID_RES}/mipmap-${density}/${file}`;
        const dest = join(OUT, 'android', `mipmap-${density}`, file);

        if (extractFromGit(rel, dest)) {
            console.log(`   ✓ android/mipmap-${density}/${file}`);
            count++;
        }
    }
}

// Splash screens
for (const dir of SPLASH_DIRS) {
    const rel = `${ANDROID_RES}/${dir}/splash.9.png`;
    const dest = join(OUT, 'android', dir, 'splash.9.png');

    if (extractFromGit(rel, dest)) {
        console.log(`   ✓ android/${dir}/splash.9.png`);
        count++;
    }
}

// Icon background XMLs
for (const xmlRel of [
    `${ANDROID_RES}/drawable/ic_launcher_background.xml`,
    `${ANDROID_RES}/values/ic_launcher_background.xml`,
]) {
    const parts = xmlRel.replace(`${ANDROID_RES}/`, '');
    const dest = join(OUT, 'android', parts);

    if (extractFromGit(xmlRel, dest)) {
        console.log(`   ✓ android/${parts}`);
        count++;
    }
}

// ---------------------------------------------------------------------------
// Web assets
// ---------------------------------------------------------------------------

for (const file of ['favicon.png', 'icon.png']) {
    const rel = `public/assets/icon/${file}`;
    const dest = join(OUT, 'web', file);

    if (extractFromGit(rel, dest)) {
        console.log(`   ✓ web/${file}`);
        count++;
    }
}

// ---------------------------------------------------------------------------
// Branding assets (from src/assets/images/ — these are the bundled defaults)
// ---------------------------------------------------------------------------

const BRANDING_MAP: Array<{ src: string; dest: string }> = [
    { src: 'src/assets/images/learncard-text-logo.svg', dest: 'text-logo.svg' },
    { src: 'src/assets/images/lca-brandmark.png', dest: 'brand-mark.png' },
    { src: 'src/assets/images/lca-icon-v2.png', dest: 'app-icon.png' },
    { src: 'src/assets/images/desktop-login-bg.png', dest: 'desktop-login-bg.png' },
    { src: 'src/assets/images/desktop-login-bg-alt.png', dest: 'desktop-login-bg-alt.png' },
];

// ---------------------------------------------------------------------------
// Config files (capacitor configs, web manifests — needed as base templates)
// ---------------------------------------------------------------------------

const CONFIG_MAP: Array<{ gitPath: string; dest: string }> = [
    { gitPath: 'ios/App/App/capacitor.config.json', dest: 'config/capacitor.config.json' },
    { gitPath: 'public/manifest.json', dest: 'config/manifest.json' },
    { gitPath: 'public/manifest.webmanifest', dest: 'config/manifest.webmanifest' },
];

for (const { gitPath, dest: destName } of CONFIG_MAP) {
    const dest = join(OUT, destName);

    if (extractFromGit(gitPath, dest)) {
        console.log(`   ✓ ${destName}`);
        count++;
    } else {
        console.warn(`   ⚠ ${destName} — not found in git HEAD`);
    }
}

for (const { src, dest: destName } of BRANDING_MAP) {
    const dest = join(OUT, 'branding', destName);

    if (copyFromSrc(src, dest)) {
        console.log(`   ✓ branding/${destName}`);
        count++;
    } else {
        console.warn(`   ⚠ branding/${destName} — source not found: ${src}`);
    }
}

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------

console.log(`\n✅ Snapshotted ${count} files into:`);
console.log(`   ${OUT}\n`);
console.log('Next steps:');
console.log('  1. Review the snapshotted files');
console.log('  2. Commit the new environments/learncard/assets/ directory');
console.log('  3. The .gitignore entries will prevent platform output files from polluting git status');
console.log('  4. Run: git rm -r --cached <paths>   to untrack the now-gitignored files');
console.log('  5. Commit the gitignore + untrack changes\n');
