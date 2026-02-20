#!/usr/bin/env node
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const packageDir = path.resolve(__dirname, '..');
const hasNodeBinary = fs.readdirSync(packageDir).some(f => f.endsWith('.node'));

// Parse --target argument if provided
const args = process.argv.slice(2);
const targetIndex = args.indexOf('--target');
const target = targetIndex !== -1 ? args[targetIndex + 1] : null;

if (!process.env.BUILD_DIDKIT_NAPI) {
    console.log('✓ BUILD_DIDKIT_NAPI not set, skipping napi build');
} else if (process.env.CI && hasNodeBinary && !target) {
    console.log('✓ CI detected with prebuilt binary, skipping napi build');
} else {
    const targetFlag = target ? ` --target ${target}` : '';
    console.log(`Building native addon...${target ? ` (target: ${target})` : ''}`);
    execSync(`napi build --platform --release --cargo-cwd native${targetFlag}`, {
        cwd: packageDir,
        stdio: 'inherit',
    });
}

console.log('Building TypeScript...');
execSync('tsc -p tsconfig.json', {
    cwd: packageDir,
    stdio: 'inherit',
});
