"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NPM = void 0;
const ramda_1 = require("ramda");
const path = __importStar(require("path"));
const utils_1 = require("../utils");
/**
 * NPM packager.
 */
class NPM {
    get lockfileName() {
        return 'package-lock.json';
    }
    get copyPackageSectionNames() {
        return [];
    }
    get mustCopyModules() {
        return true;
    }
    async getNpmMajorVersion(cwd) {
        const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
        const args = ['--version'];
        const processOutput = await (0, utils_1.spawnProcess)(command, args, { cwd });
        const version = processOutput.stdout.trim();
        return parseInt(version.split('.')[0]);
    }
    async getProdDependencies(cwd, depth) {
        // Get first level dependency graph
        const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
        const args = [
            'ls',
            '-json',
            '-prod',
            '-long',
            depth ? `-depth=${depth}` : (await this.getNpmMajorVersion(cwd)) >= 7 ? '-all' : null,
        ].filter(Boolean);
        const ignoredNpmErrors = [
            { npmError: 'extraneous', log: false },
            { npmError: 'missing', log: false },
            { npmError: 'peer dep missing', log: true },
            { npmError: 'code ELSPROBLEMS', log: false },
        ];
        let parsedDeps;
        try {
            const processOutput = await (0, utils_1.spawnProcess)(command, args, { cwd });
            parsedDeps = JSON.parse(processOutput.stdout);
        }
        catch (err) {
            if (err instanceof utils_1.SpawnError) {
                // Only exit with an error if we have critical npm errors for 2nd level inside
                // Split the stderr by \n character to get the npm ERR! plaintext lines, ignore additonal JSON blob (emitted by npm >=7)
                // see https://github.com/serverless-heaven/serverless-webpack/pull/782 and https://github.com/floydspace/serverless-esbuild/issues/288
                const lines = (0, ramda_1.split)('\n', err.stderr);
                const npmErrors = (0, ramda_1.takeWhile)((line) => line !== '{', lines);
                const hasThrowableErrors = npmErrors.every((error) => !(0, ramda_1.isEmpty)(error) &&
                    !(0, ramda_1.any)((ignoredError) => (0, ramda_1.startsWith)(`npm ERR! ${ignoredError.npmError}`, error), ignoredNpmErrors));
                if (!hasThrowableErrors && !(0, ramda_1.isEmpty)(err.stdout)) {
                    return { stdout: err.stdout };
                }
            }
            throw err;
        }
        const basePath = parsedDeps.path;
        const convertTrees = (currentTree, rootDeps, currentDeps = rootDeps) => {
            return Object.entries(currentTree).reduce((deps, [name, tree]) => {
                var _a, _b, _c;
                if (tree.path === path.join(basePath, 'node_modules', name)) {
                    // Module path is in the root folder
                    // If this isn't the root of the tree
                    if (rootDeps !== deps) {
                        // Set it as resolved
                        (_a = deps[name]) !== null && _a !== void 0 ? _a : (deps[name] = {
                            version: tree.version,
                            isRootDep: true,
                        });
                    }
                    if (tree._deduped || (!(0, ramda_1.isEmpty)(tree._dependencies) && !tree.dependencies)) {
                        // Edge case - When it is de-duped this record will not contain the dependency tree.
                        // _deduped is for v6 (Object.keys(tree._dependencies).length && !tree.dependencies) for v7
                        // We can just ignore storing this at the root because it does not contain the tree we are after
                        // "samchungy-dep-b": {
                        //   "version": "3.0.0",
                        //   "name": "samchungy-dep-b",
                        //   "resolved": "https://registry.npmjs.org/samchungy-dep-b/-/samchungy-dep-b-3.0.0.tgz",
                        //   "integrity": "sha512-fy6RAnofLSnLHgOUmgsFz0ZFnJcJeNHT+qUfHJ7daIFlBaciRDR6v5sdWm7mAM2EzQ1KFf2hmKJVFZgthVeCAw==",
                        //   "_id": "samchungy-dep-b@3.0.0",
                        //   "extraneous": false,
                        //   "path": "/Users/schung/me/serverless-esbuild/examples/individually/node_modules/samchungy-dep-b",
                        //   "_dependencies": {
                        //     "samchungy-dep-c": "^1.0.0",
                        //     "samchungy-dep-d": "^1.0.0"
                        //   },
                        //   "devDependencies": {},
                        //   "peerDependencies": {}
                        // }
                    }
                    else {
                        // This is a root node_modules dependency
                        (_b = rootDeps[name]) !== null && _b !== void 0 ? _b : (rootDeps[name] = {
                            version: tree.version,
                            ...(tree.dependencies &&
                                !(0, ramda_1.isEmpty)(tree.dependencies) && {
                                dependencies: convertTrees(tree.dependencies, rootDeps, {}),
                            }),
                        });
                    }
                    return deps;
                }
                // Module is only installed within the node_modules of this dep. Iterate through it's dep tree
                (_c = deps[name]) !== null && _c !== void 0 ? _c : (deps[name] = {
                    version: tree.version,
                    ...(tree.dependencies &&
                        !(0, ramda_1.isEmpty)(tree.dependencies) && {
                        dependencies: convertTrees(tree.dependencies, rootDeps, {}),
                    }),
                });
                return deps;
            }, currentDeps);
        };
        return {
            ...(parsedDeps.dependencies &&
                !(0, ramda_1.isEmpty)(parsedDeps.dependencies) && {
                dependencies: convertTrees(parsedDeps.dependencies, {}),
            }),
        };
    }
    _rebaseFileReferences(pathToPackageRoot, moduleVersion) {
        if (/^file:[^/]{2}/.test(moduleVersion)) {
            const filePath = (0, ramda_1.replace)(/^file:/, '', moduleVersion);
            return (0, ramda_1.replace)(/\\/g, '/', `file:${pathToPackageRoot}/${filePath}`);
        }
        return moduleVersion;
    }
    /**
     * We should not be modifying 'package-lock.json'
     * because this file should be treated as internal to npm.
     *
     * Rebase package-lock is a temporary workaround and must be
     * removed as soon as https://github.com/npm/npm/issues/19183 gets fixed.
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
    async install(cwd, extraArgs) {
        const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
        const args = ['install', ...extraArgs];
        await (0, utils_1.spawnProcess)(command, args, { cwd });
    }
    async prune(cwd) {
        const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
        const args = ['prune'];
        await (0, utils_1.spawnProcess)(command, args, { cwd });
    }
    async runScripts(cwd, scriptNames) {
        const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
        await Promise.all(scriptNames.map((scriptName) => {
            const args = ['run', scriptName];
            return (0, utils_1.spawnProcess)(command, args, { cwd });
        }));
    }
}
exports.NPM = NPM;
