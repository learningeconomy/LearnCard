#!/usr/bin/env node
// tools/capgo/check-channel-bump.js
//
// Detects whether a PR makes backwards-incompatible native runtime changes
// that require bumping the Capgo OTA channel in
// `apps/learn-card-app/capacitor.config.ts:defaultChannel`.
//
// Usage:
//   node tools/capgo/check-channel-bump.js \
//        --base <baseSha> \
//        --head <headSha> \
//       [--out  <jsonPath>]
//
// Behavior:
//   - Compares native runtime deps in `apps/learn-card-app/package.json`
//     between base and head SHAs (adds / removes / version changes).
//   - Compares tracked native source files (iOS / Android source, Podfile,
//     Android template manifests / build.gradle).
//   - Reads `defaultChannel` from `capacitor.config.ts` at both SHAs and
//     determines whether it was bumped.
//   - Writes a JSON result to stdout (always) and to --out (if provided).
//   - Exit code is always 0; consumers should branch on `result.guardFailed`.
//
// This script is intentionally dependency-free and runs on plain Node.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);

const argFlag = (flag) => {
    const i = args.indexOf(flag);

    return i === -1 ? undefined : args[i + 1];
};

const base = argFlag('--base');
const head = argFlag('--head');
const outPath = argFlag('--out');

if (!base || !head) {
    console.error('Usage: node check-channel-bump.js --base <sha> --head <sha> [--out <path>]');
    process.exit(2);
}

const REPO_ROOT = path.resolve(__dirname, '../../');
const PACKAGE_JSON = 'apps/learn-card-app/package.json';
const CAPACITOR_CONFIG = 'apps/learn-card-app/capacitor.config.ts';

// --- Native compat-affecting paths -----------------------------------------
//
// We deliberately do NOT include `capacitor.config.ts` itself: cosmetic /
// comment edits there are common, and any *real* compat change shows up as
// either a native dep change in package.json OR a touched native source file.
//
const NATIVE_PATH_PATTERNS = [
    /^apps\/learn-card-app\/ios\/App\/Podfile$/,
    /^apps\/learn-card-app\/ios\/App\/App\/.*\.(swift|m|mm|h)$/,
    /^apps\/learn-card-app\/android\/app\/src\/main\/java\//,
    /^apps\/learn-card-app\/android\/app\/src\/main\/kotlin\//,
    /^apps\/learn-card-app\/android\/app\/src\/main\/AndroidManifest\.xml\.template$/,
    /^apps\/learn-card-app\/android\/app\/build\.gradle\.template$/,
    /^apps\/learn-card-app\/android\/build\.gradle$/,
    /^apps\/learn-card-app\/android\/variables\.gradle$/,
];

// --- Native runtime dep classifier -----------------------------------------
//
// Anything matching these patterns is treated as a Capacitor / Capgo runtime
// plugin (i.e. ships native code into the binary).
//
const NATIVE_DEP_PATTERNS = [
    /^@capacitor\//,
    /^@capgo\//,
    /^@capacitor-/, // @capacitor-community, @capacitor-firebase, @capacitor-mlkit, ...
    /^@capawesome\//,
    /^capacitor-/, // capacitor-native-settings, capacitor-plugin-safe-area, ...
];

// Tooling deps that match the patterns but do NOT ship native code at runtime.
const EXCLUDED_DEPS = new Set([
    '@capacitor/cli',
    '@capacitor/assets',
    '@capgo/cli',
]);

const isNativeDep = (name) =>
    !EXCLUDED_DEPS.has(name) && NATIVE_DEP_PATTERNS.some(re => re.test(name));

// --- Git helpers ------------------------------------------------------------

const gitShowFile = (sha, file) => {
    try {
        return execSync(`git show ${sha}:${file}`, {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore'],
            maxBuffer: 32 * 1024 * 1024,
        });
    } catch {
        return ''; // file may not exist at this sha
    }
};

const getChangedFiles = (baseSha, headSha) => {
    const out = execSync(`git diff --name-only ${baseSha}...${headSha}`, {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        maxBuffer: 32 * 1024 * 1024,
    });

    return out.split('\n').filter(Boolean);
};

// --- Extractors -------------------------------------------------------------

const extractDefaultChannel = (configContent) => {
    if (!configContent) return null;

    const m = configContent.match(/defaultChannel\s*:\s*['"]([^'"]+)['"]/);

    return m ? m[1] : null;
};

const collectNativeDeps = (pkgJsonContent) => {
    if (!pkgJsonContent.trim()) return {};

    try {
        const pkg = JSON.parse(pkgJsonContent);
        const deps = pkg.dependencies ?? {};
        const native = {};

        for (const [name, version] of Object.entries(deps)) {
            if (isNativeDep(name)) native[name] = version;
        }

        return native;
    } catch {
        return {};
    }
};

const diffNativeDeps = (baseDeps, headDeps) => {
    const added = [];
    const removed = [];
    const changed = [];
    const allNames = new Set([...Object.keys(baseDeps), ...Object.keys(headDeps)]);

    for (const name of allNames) {
        const a = baseDeps[name];
        const b = headDeps[name];

        if (a === undefined && b !== undefined) added.push({ name, to: b });
        else if (a !== undefined && b === undefined) removed.push({ name, from: a });
        else if (a !== b) changed.push({ name, from: a, to: b });
    }

    return { added, removed, changed };
};

// --- Run --------------------------------------------------------------------

const changedFiles = getChangedFiles(base, head);

const nativeFileChanges = changedFiles.filter(f =>
    NATIVE_PATH_PATTERNS.some(re => re.test(f)),
);

const baseDeps = collectNativeDeps(gitShowFile(base, PACKAGE_JSON));
const headDeps = collectNativeDeps(gitShowFile(head, PACKAGE_JSON));
const depDiff = diffNativeDeps(baseDeps, headDeps);

const baseChannel = extractDefaultChannel(gitShowFile(base, CAPACITOR_CONFIG));
const headChannel = extractDefaultChannel(gitShowFile(head, CAPACITOR_CONFIG));

const channelBumped =
    baseChannel !== null && headChannel !== null && baseChannel !== headChannel;

const nativeCompatChanged =
    nativeFileChanges.length > 0 ||
    depDiff.added.length > 0 ||
    depDiff.removed.length > 0 ||
    depDiff.changed.length > 0;

const guardFailed = nativeCompatChanged && !channelBumped;

const result = {
    base,
    head,
    baseChannel,
    headChannel,
    channelBumped,
    nativeCompatChanged,
    guardFailed,
    nativeFileChanges,
    depDiff,
};

const json = JSON.stringify(result, null, 2);

process.stdout.write(json + '\n');

if (outPath) {
    fs.writeFileSync(outPath, json + '\n', 'utf-8');
}

process.exit(0);
