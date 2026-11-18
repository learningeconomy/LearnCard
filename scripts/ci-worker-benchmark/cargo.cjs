'use strict';

const { execFileSync } = require('node:child_process');
const { existsSync, lstatSync, readFileSync, realpathSync } = require('node:fs');
const path = require('node:path');

const PROJECTS = [
    'services/escrow-enclave-app',
    'services/escrow-enclave-host',
    'services/escrow-ledger-monitor',
];
const REDIRECTS = [
    'CARGO_TARGET_DIR',
    'CARGO_BUILD_TARGET_DIR',
    'CARGO_BUILD_BUILD_DIR',
    'RUSTC_WRAPPER',
    'RUSTC_WORKSPACE_WRAPPER',
    'CARGO_BUILD_RUSTC_WRAPPER',
    'CARGO_BUILD_RUSTC_WORKSPACE_WRAPPER',
    'BUILD_DIDKIT_NAPI',
];

const ensure = (condition, message) => {
    if (!condition) throw new Error(message);
};
const statIfExists = file => {
    try {
        return lstatSync(file);
    } catch (error) {
        if (error.code === 'ENOENT') return undefined;
        throw error;
    }
};

/** Refuse hidden compiler caches: cleaning Cargo target trees must really be cold. */
const validateCargoEnvironment = (root, environment) => {
    for (const name of REDIRECTS) {
        ensure(!environment[name], `Cargo cache control forbids ${name}.`);
    }
    const flagNames = [
        'RUSTFLAGS',
        'CARGO_ENCODED_RUSTFLAGS',
        'CARGO_BUILD_RUSTFLAGS',
        ...Object.keys(environment).filter(name => /^CARGO_TARGET_.+_RUSTFLAGS$/.test(name)),
    ];
    for (const name of flagNames) {
        ensure(
            !/incremental\s*(?:=|\s)/i.test(environment[name] || ''),
            'External Rust incremental cache is forbidden.'
        );
    }
    const configDirs = new Set();
    const cargoHome = environment.CARGO_HOME || path.join(environment.HOME || '', '.cargo');
    ensure(path.isAbsolute(cargoHome), 'Cargo home must be an absolute path.');
    configDirs.add(cargoHome);
    for (const project of PROJECTS) {
        let directory = path.resolve(root, project);
        while (true) {
            configDirs.add(path.join(directory, '.cargo'));
            const parent = path.dirname(directory);
            if (parent === directory) break;
            directory = parent;
        }
    }
    for (const directory of configDirs) {
        for (const name of ['config', 'config.toml']) {
            const config = path.join(directory, name);
            if (!existsSync(config)) continue;
            const contents = readFileSync(config, 'utf8');
            ensure(
                !/["']?(?:rustc(?:-workspace)?-wrapper|build-dir)["']?\s*=/i.test(contents) &&
                    !/incremental\s*(?:=|\s)/i.test(contents),
                `Cargo configuration redirects build artifacts or contains a compiler wrapper: ${config}`
            );
        }
    }
};

/** Confirm Cargo's effective workspace and target paths before any destructive clean. */
const inspectTargets = (root, environment, execute = execFileSync) => {
    const realRoot = realpathSync(root);
    validateCargoEnvironment(realRoot, environment);
    return PROJECTS.map(project => {
        const cwd = path.resolve(realRoot, project);
        ensure(realpathSync(cwd) === cwd, `Cargo project path is redirected: ${project}`);
        const target = path.join(cwd, 'target');
        const raw = execute('cargo', ['metadata', '--no-deps', '--format-version=1', '--locked'], {
            cwd,
            env: environment,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'inherit'],
        });
        const metadata = JSON.parse(raw);
        ensure(metadata.workspace_root === cwd, `Unexpected Cargo workspace: ${project}`);
        ensure(
            metadata.target_directory === target,
            `Unexpected Cargo target directory: ${project}`
        );
        const targetStat = statIfExists(target);
        if (targetStat) {
            ensure(
                !targetStat.isSymbolicLink() &&
                    targetStat.isDirectory() &&
                    realpathSync(target) === target,
                `Cargo target directory is redirected: ${project}`
            );
        }
        return { project, cwd, target };
    });
};

/** Warm the package registry and compiler outside the timed runs without executing tests. */
const preloadCargo = (root, environment, execute = execFileSync) => {
    const targets = inspectTargets(root, environment, execute);
    for (const { project, cwd } of targets) {
        console.log(`Preloading Cargo test dependencies: ${project}`);
        execute('cargo', ['test', '--no-run', '--locked'], {
            cwd,
            env: environment,
            stdio: 'inherit',
        });
    }
    return targets.map(({ project }) => project);
};

/** Reset each verified project-local target tree so every measured pass recompiles. */
const resetCargoTargets = (root, environment, execute = execFileSync) => {
    ensure(
        environment.GITHUB_ACTIONS === 'true' &&
            environment.GITHUB_EVENT_NAME === 'workflow_dispatch' &&
            environment.LC_WORKER_BENCHMARK === '1' &&
            environment.GITHUB_WORKSPACE &&
            realpathSync(environment.GITHUB_WORKSPACE) === realpathSync(root),
        'Cargo cleanup is restricted to the benchmark workflow workspace.'
    );
    const targets = inspectTargets(root, environment, execute);
    for (const { project, cwd, target } of targets) {
        console.log(`Cleaning Cargo test artifacts: ${project}`);
        execute('cargo', ['clean'], { cwd, env: environment, stdio: 'inherit' });
        ensure(!statIfExists(target), `Cargo target was not fully cleaned: ${project}`);
    }
    return targets.map(({ project }) => project);
};

/** Fail if a selected Cargo test did not recreate its expected target directory. */
const verifyCargoTargetsBuilt = (root, environment, execute = execFileSync) => {
    const targets = inspectTargets(root, environment, execute);
    for (const { project, target } of targets) {
        ensure(
            existsSync(target) && lstatSync(target).isDirectory(),
            `Cargo target was not built: ${project}`
        );
    }
};

module.exports = {
    PROJECTS,
    validateCargoEnvironment,
    inspectTargets,
    preloadCargo,
    resetCargoTargets,
    verifyCargoTargetsBuilt,
};
