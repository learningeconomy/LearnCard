#!/usr/bin/env node

/**
 * Cold-installs @learncard/cli the way an agent or developer does (`npx` with an empty cache),
 * runs it (including a real credential verification), and enforces an install budget.
 *
 *   node scripts/check-cli-install.mjs --package=@learncard/cli@4.1.0
 *   node scripts/check-cli-install.mjs --package=file:/abs/path/learncard-cli-4.1.0.tgz
 *
 * Fails when the install exceeds the budget, prints an EBADENGINE or deprecation warning,
 * or the CLI does not run and verify a signed credential. Budget overrides: --max-mb=<n> --max-packages=<n>.
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
const maxMegabytes = Number(readArg('max-mb') ?? DEFAULT_MAX_MB);
const maxPackages = Number(readArg('max-packages') ?? DEFAULT_MAX_PACKAGES);
// A NaN budget would make every comparison below false and pass without checking anything.
if (!(maxMegabytes > 0) || !Number.isInteger(maxPackages) || maxPackages < 1) {
    console.error('--max-mb must be a positive number and --max-packages a positive integer');
    process.exit(2);
}
const maxBytes = maxMegabytes * 1024 * 1024;

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
/**
 * Runs the CLI through npx. When npx cannot be spawned at all (ENOENT, timeout), spawnSync
 * leaves stdout/stderr null and sets `error`; normalise that into strings so the caller
 * reports a FAIL line instead of crashing.
 */
const npx = (...cliArgs) => {
    const result = spawnSync(
        'npx',
        ['-y', '--cache', cache, `--package=${packageSpec}`, 'learncard', ...cliArgs],
        {
            cwd: workDirectory,
            encoding: 'utf8',
            shell: process.platform === 'win32',
        }
    );

    return {
        status: result.status,
        stdout: result.stdout ?? '',
        stderr: result.error ? `could not run npx: ${result.error.message}` : (result.stderr ?? ''),
    };
};

/**
 * A credential signed by a throwaway did:key (seed "aaaa…"), with no expiry. Verifying it needs
 * no network, and exercises the didkit WASM that ships next to the bundle.
 */
const SIGNED_CREDENTIAL = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    'id': 'urn:uuid:adffb183-204f-4620-b7db-859c41513bff',
    'type': ['VerifiableCredential'],
    'credentialSubject': {
        'id': 'did:example:d23dd687a7dc6787646f2eb98d0',
    },
    'issuer': 'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzii7Uh4aHoqH',
    'proof': {
        'type': 'DataIntegrityProof',
        'proofPurpose': 'assertionMethod',
        'proofValue':
            'z38AzfTWRfQ35QrFs3iWePRqdSw9VfR76P4rpeVMVx1NMj6pybzDU8bzW2fH1pMWXntvjezXNwQEEhKSx3bdsScgw',
        'verificationMethod':
            'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzii7Uh4aHoqH#z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzii7Uh4aHoqH',
        'created': '2026-11-14T17:21:37.566Z',
        'cryptosuite': 'eddsa-rdfc-2022',
    },
    'validFrom': '2026-11-14T17:21:37.564Z',
};

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

    fs.writeFileSync(
        path.join(workDirectory, 'credential.json'),
        JSON.stringify(SIGNED_CREDENTIAL)
    );
    const verify = npx('verify', 'credential.json', '--json');
    let verified = false;
    try {
        verified = JSON.parse(verify.stdout).verified === true;
    } catch {
        // reported below
    }
    if (!verified) {
        failures.push(
            `\`learncard verify\` did not verify the signed fixture: ${
                verify.stdout.trim() || verify.stderr.trim()
            }`
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
        // Only the first npx call installs, so only its stderr carries npm's warnings.
        engineWarnings: (version.stderr.match(/EBADENGINE\s+package:/g) ?? []).length,
        deprecationWarnings: (version.stderr.match(/npm warn deprecated/gi) ?? []).length,
        commandCount,
        verifiedFixture: verified,
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
