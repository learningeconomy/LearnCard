#!/usr/bin/env node
// Fails CI when safe-area primitives are referenced outside the surface layer.
// The allowlist is SHRINK-ONLY: removing entries is always fine; adding one
// requires a design-level reason (see LC-1962 design doc).
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PATTERNS = [
    'env(safe-area',
    'constant(safe-area',
    '--ion-safe-area',
    '--safe-area-inset',
    '--lc-safe-',
    'useSafeArea',
    'safe-area-top-margin',
    'safe-area-bottom-padding',
    'capacitor-plugin-safe-area',
];

// Only these paths may reference the primitives.
const SURFACE_LAYER = [
    'packages/learn-card-base/src/assets/styles/safe-area.scss',
    'packages/learn-card-base/src/components/modals/surfaces/',
    'packages/learn-card-base/src/dev/simulateInsets.ts',
    'apps/learn-card-app/src/theme/variables.css',
    'apps/scouts/src/theme/variables.css',
    'scripts/check-safe-area.mjs',
    'scripts/safe-area-allowlist.json',
];

const allowlist = JSON.parse(readFileSync('scripts/safe-area-allowlist.json', 'utf8'));

// The dual-host idiom is the ONLY sanctioned use of --ion-safe-area-* in leaf
// files: `var(--ion-safe-area-top, 0px)` / `var(--ion-safe-area-bottom, 0px)`
// resolves to 0 inside AppModal surfaces (COMPAT shims) and to the real inset
// on routes / Ionic-hosted modals. Anything else referencing the var (setting
// it, using it without the 0px fallback, etc.) is still a violation.
const DUAL_HOST_IDIOM = /var\(--ion-safe-area-(?:top|right|bottom|left),\s*0px\)/g;

const grepPattern = PATTERNS.map(p => p.replace(/[().*+?[\]\\-]/g, '\\$&')).join('|');
let out = '';
try {
    out = execSync(
        `git grep -nE '${grepPattern}' -- 'apps/learn-card-app/src' 'apps/scouts/src' 'packages/learn-card-base/src' 'packages/react-learn-card/src'`,
        { encoding: 'utf8' }
    );
} catch (e) {
    if (e.status === 1)
        out = ''; // no matches
    else throw e;
}

const violations = out
    .split('\n')
    .filter(Boolean)
    // Lines whose only safe-area reference is the sanctioned dual-host idiom pass.
    .filter(line => line.replace(DUAL_HOST_IDIOM, '').match(grepPattern))
    .map(line => line.split(':')[0])
    .filter(file => !SURFACE_LAYER.some(p => file.startsWith(p)))
    .filter(file => !allowlist.files.includes(file));

const unique = [...new Set(violations)];
if (unique.length > 0) {
    console.error('❌ safe-area primitives referenced outside the surface layer:\n');
    for (const f of unique) console.error(`  ${f}`);
    console.error(
        '\nRule: inside an AppModal/AppScreen, never mention safe area — the surface owns insets.' +
            '\nIf this file IS a surface, add it to SURFACE_LAYER in scripts/check-safe-area.mjs.' +
            '\nLegacy files live in scripts/safe-area-allowlist.json (shrink-only).'
    );
    process.exit(1);
}
console.log(`✅ safe-area gate clean (${allowlist.files.length} legacy files on allowlist)`);
