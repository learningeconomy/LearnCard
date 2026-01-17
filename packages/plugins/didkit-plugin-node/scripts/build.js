#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageDir = path.resolve(__dirname, '..');
const hasNodeBinary = fs.readdirSync(packageDir).some(f => f.endsWith('.node'));

if (process.env.SKIP_DIDKIT_NAPI) {
    console.log('✓ SKIP_DIDKIT_NAPI set, skipping napi build');
} else if (process.env.CI && hasNodeBinary) {
    console.log('✓ CI detected with prebuilt binary, skipping napi build');
} else {
    console.log('Building native addon...');
    execSync('napi build --platform --release --cargo-cwd native', {
        cwd: packageDir,
        stdio: 'inherit',
    });
}

console.log('Building TypeScript...');
execSync('tsc -p tsconfig.json', {
    cwd: packageDir,
    stdio: 'inherit',
});
