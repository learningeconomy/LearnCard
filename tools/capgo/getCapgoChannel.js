#!/usr/bin/env node
// tools/capgo/getCapgoChannel.js

const fs = require('fs');
const path = require('path');

// ---- CLI ARG PARSING ----
const args = process.argv.slice(2);
const appArgIndex = args.indexOf('--app');
if (appArgIndex === -1 || !args[appArgIndex + 1]) {
    console.error('❌ Missing --app argument (expected: lca or scouts)');
    process.exit(1);
}

const app = args[appArgIndex + 1];

const appConfigPaths = {
    lca: 'apps/learn-card-app/capacitor.config.ts',
    scouts: 'apps/scouts/capacitor.config.ts',
};

if (!appConfigPaths[app]) {
    console.error(`❌ Unknown app "${app}". Use: lca or scouts`);
    process.exit(1);
}

// ROOT OF REPO (the directory this script lives in is tools/capgo/)
const repoRoot = path.resolve(__dirname, '../../');

// Paths
const configPath = path.join(repoRoot, appConfigPaths[app]);

// ---- READ FILE ----
if (!fs.existsSync(configPath)) {
    console.error(`❌ capacitor.config.ts not found at: ${configPath}`);
    process.exit(1);
}

const configContent = fs.readFileSync(configPath, 'utf8');

// ---- PARSE CHANNEL ----
const match = configContent.match(/defaultChannel:\s*['"](.+?)['"]/);

if (!match) {
    console.error('❌ Could not find "defaultChannel" in capacitor.config.ts');
    process.exit(1);
}

const channel = match[1];

// ---- OUTPUT ----
console.log(channel);
