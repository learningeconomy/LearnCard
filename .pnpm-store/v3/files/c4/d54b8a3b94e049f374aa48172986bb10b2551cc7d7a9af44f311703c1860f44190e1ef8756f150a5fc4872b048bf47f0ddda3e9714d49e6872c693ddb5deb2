"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pnpm = void 0;
const ramda_1 = require("ramda");
const utils_1 = require("../utils");
/**
 * pnpm packager.
 */
class Pnpm {
    get lockfileName() {
        return 'pnpm-lock.yaml';
    }
    get copyPackageSectionNames() {
        return [];
    }
    get mustCopyModules() {
        return false;
    }
    async getProdDependencies(cwd, depth) {
        // Get first level dependency graph
        const command = /^win/.test(process.platform) ? 'pnpm.cmd' : 'pnpm';
        const args = [
            'ls',
            '--prod',
            '--json',
            depth ? `--depth=${depth}` : null,
        ].filter(Boolean);
        // If we need to ignore some errors add them here
        const ignoredPnpmErrors = [];
        try {
            const processOutput = await (0, utils_1.spawnProcess)(command, args, { cwd });
            const depJson = processOutput.stdout;
            return JSON.parse(depJson);
        }
        catch (err) {
            if (err instanceof utils_1.SpawnError) {
                // Only exit with an error if we have critical npm errors for 2nd level inside
                const errors = (0, ramda_1.split)('\n', err.stderr);
                const failed = (0, ramda_1.reduce)((f, error) => {
                    if (f) {
                        return true;
                    }
                    return (!(0, ramda_1.isEmpty)(error) &&
                        !(0, ramda_1.any)((ignoredError) => (0, ramda_1.startsWith)(`npm ERR! ${ignoredError.npmError}`, error), ignoredPnpmErrors));
                }, false, errors);
                if (!failed && !(0, ramda_1.isEmpty)(err.stdout)) {
                    return { stdout: err.stdout };
                }
            }
            throw err;
        }
    }
    _rebaseFileReferences(pathToPackageRoot, moduleVersion) {
        if (/^file:[^/]{2}/.test(moduleVersion)) {
            const filePath = (0, ramda_1.replace)(/^file:/, '', moduleVersion);
            return (0, ramda_1.replace)(/\\/g, '/', `file:${pathToPackageRoot}/${filePath}`);
        }
        return moduleVersion;
    }
    /**
     * We should not be modifying 'pnpm-lock.yaml'
     * because this file should be treated as internal to pnpm.
     */
    rebaseLockfile(pathToPackageRoot, lockfile) {
        if (lockfile.version) {
            lockfile.version = this._rebaseFileReferences(pathToPackageRoot, lockfile.version);
        }
        if (lockfile.dependencies) {
            for (const lockedDependency in lockfile.dependencies) {
                this.rebaseLockfile(pathToPackageRoot, lockedDependency);
            }
        }
        return lockfile;
    }
    async install(cwd, extraArgs, useLockfile = true) {
        const command = /^win/.test(process.platform) ? 'pnpm.cmd' : 'pnpm';
        const args = useLockfile
            ? ['install', '--frozen-lockfile', ...extraArgs]
            : ['install', ...extraArgs];
        await (0, utils_1.spawnProcess)(command, args, { cwd });
    }
    async prune(cwd) {
        const command = /^win/.test(process.platform) ? 'pnpm.cmd' : 'pnpm';
        const args = ['prune'];
        await (0, utils_1.spawnProcess)(command, args, { cwd });
    }
    async runScripts(cwd, scriptNames) {
        const command = /^win/.test(process.platform) ? 'pnpm.cmd' : 'pnpm';
        await Promise.all(scriptNames.map((scriptName) => {
            const args = ['run', scriptName];
            return (0, utils_1.spawnProcess)(command, args, { cwd });
        }));
    }
}
exports.Pnpm = Pnpm;
