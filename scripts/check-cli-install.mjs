#!/usr/bin/env node

/**
 * Cold-installs @learncard/cli the way an agent or developer does (`npx` with an empty cache),
 * runs it, and enforces an install budget.
 *
 *   node scripts/check-cli-install.mjs --package=@learncard/cli@4.1.0
 *   node scripts/check-cli-install.mjs --package=file:/abs/path/learncard-cli-4.1.0.tgz
 *
 * Fails when the install exceeds the budget, prints an EBADENGINE or deprecation warning,
 * or the CLI does not run. Budget overrides: --max-mb=<n> --max-packages=<n>.
 * Install time is reported but never fails the check (runners vary).
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_MAX_MB = 25;
const DEFAULT_MAX_PACKAGES = 5;

const readArg = name => {
    const prefix = `--${name}=`;
    return process.argv.find(arg => arg.startsWith(prefix))?.slice(prefix.length);
};

const packageSpec = readArg('package');
if (!packageSpec) {
    console.error('Usage: check-cli-install.mjs --package=<npm spec or file:tarball>');
    process.exit(2);
}
const maxBytes = Number(readArg('max-mb') ?? DEFAULT_MAX_MB) * 1024 * 1024;
const maxPackages = Number(readArg('max-packages') ?? DEFAULT_MAX_PACKAGES);

const directorySize = directory => {
    let bytes = 0;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) continue;
        bytes += entry.isDirectory() ? directorySize(file) : fs.statSync(file).size;
    }
    return bytes;
};

/** Counts installed packages from the lockfile npx writes next to node_modules. */
const installedPackages = npxDirectory => {
    const lock = JSON.parse(fs.readFileSync(path.join(npxDirectory, 'package-lock.json'), 'utf8'));
    return Object.keys(lock.packages ?? {}).filter(key => key !== '').length;
};

const workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-cli-install-'));
const cache = path.join(workDirectory, 'cache');
const npx = (...cliArgs) =>
    spawnSync(
        'npx',
        ['-y', '--cache', cache, `--package=${packageSpec}`, 'learncard', ...cliArgs],
        {
            cwd: workDirectory,
            encoding: 'utf8',
            shell: process.platform === 'win32',
        }
    );

const failures = [];

try {
    const started = Date.now();
    const version = npx('--version');
    const coldInstallSeconds = (Date.now() - started) / 1000;

    if (version.status !== 0) {
        failures.push(`\`learncard --version\` exited ${version.status}: ${version.stderr.trim()}`);
    }

    const commands = npx('commands', '--json');
    let commandCount = 0;
    try {
        const parsed = JSON.parse(commands.stdout);
        commandCount = parsed.commands?.length ?? 0;
        if (commands.status !== 0 || parsed.ok !== true || commandCount === 0) {
            failures.push('`learncard commands --json` did not return a command list');
        }
    } catch {
        failures.push(
            `\`learncard commands --json\` did not print JSON: ${commands.stderr.trim()}`
        );
    }

    const npxRoot = path.join(cache, '_npx');
    const npxDirectory = fs.existsSync(npxRoot)
        ? fs
              .readdirSync(npxRoot)
              .map(name => path.join(npxRoot, name))
              .find(directory => fs.existsSync(path.join(directory, 'node_modules')))
        : undefined;

    const summary = {
        package: packageSpec,
        node: process.version,
        version: version.stdout.trim(),
        coldInstallSeconds,
        installedBytes: 0,
        installedPackages: 0,
        engineWarnings: (version.stderr.match(/EBADENGINE\s+package:/g) ?? []).length,
        deprecationWarnings: (version.stderr.match(/npm warn deprecated/gi) ?? []).length,
        commandCount,
        budget: { maxBytes, maxPackages },
    };

    if (!npxDirectory) {
        failures.push('npx install directory not found');
    } else {
        summary.installedBytes = directorySize(path.join(npxDirectory, 'node_modules'));
        summary.installedPackages = installedPackages(npxDirectory);
    }

    if (summary.installedBytes > maxBytes) {
        failures.push(
            `install is ${(summary.installedBytes / 1024 / 1024).toFixed(1)} MB, budget is ${
                maxBytes / 1024 / 1024
            } MB`
        );
    }
    if (summary.installedPackages > maxPackages) {
        failures.push(
            `install has ${summary.installedPackages} packages, budget is ${maxPackages}`
        );
    }
    if (summary.engineWarnings > 0) {
        failures.push(`${summary.engineWarnings} EBADENGINE warning(s) on ${process.version}`);
    }
    if (summary.deprecationWarnings > 0) {
        failures.push(`${summary.deprecationWarnings} deprecation warning(s)`);
    }

    console.log(JSON.stringify(summary, null, 2));
} finally {
    fs.rmSync(workDirectory, { recursive: true, force: true });
}

if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL: ${failure}`);
    process.exit(1);
}

console.log('OK: @learncard/cli install is within budget and runs.');
