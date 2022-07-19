"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Yarn = void 0;
const ramda_1 = require("ramda");
const utils_1 = require("../utils");
const semver_1 = require("semver");
const getNameAndVersion = (name) => {
    const atIndex = name.lastIndexOf('@');
    return {
        name: name.slice(0, atIndex),
        version: name.slice(atIndex + 1),
    };
};
/**
 * Yarn packager.
 *
 * Yarn specific packagerOptions (default):
 *   flat (false) - Use --flat with install
 *   ignoreScripts (false) - Do not execute scripts during install
 */
class Yarn {
    get lockfileName() {
        return 'yarn.lock';
    }
    get copyPackageSectionNames() {
        return ['resolutions'];
    }
    get mustCopyModules() {
        return false;
    }
    async getProdDependencies(cwd, depth) {
        const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
        const args = ['list', depth ? `--depth=${depth}` : null, '--json', '--production'].filter(Boolean);
        // If we need to ignore some errors add them here
        const ignoredYarnErrors = [];
        let parsedDeps;
        try {
            const processOutput = await (0, utils_1.spawnProcess)(command, args, { cwd });
            parsedDeps = JSON.parse(processOutput.stdout);
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
                        !(0, ramda_1.any)((ignoredError) => (0, ramda_1.startsWith)(`npm ERR! ${ignoredError.npmError}`, error), ignoredYarnErrors));
                }, false, errors);
                if (!failed && !(0, ramda_1.isEmpty)(err.stdout)) {
                    return { stdout: err.stdout };
                }
            }
            throw err;
        }
        const rootTree = parsedDeps.data.trees;
        // Produces a version map for the modules present in our root node_modules folder
        const rootDependencies = rootTree.reduce((deps, tree) => {
            var _a;
            const { name, version } = getNameAndVersion(tree.name);
            (_a = deps[name]) !== null && _a !== void 0 ? _a : (deps[name] = {
                version: version,
            });
            return deps;
        }, {});
        const convertTrees = (trees) => {
            return trees.reduce((deps, tree) => {
                var _a, _b, _c;
                const { name, version } = getNameAndVersion(tree.name);
                if (tree.shadow) {
                    // Package is resolved somewhere else
                    if ((0, semver_1.satisfies)(rootDependencies[name].version, version)) {
                        // Package is at root level
                        // {
                        //   "name": "samchungy-dep-a@1.0.0", <- MATCH
                        //   "children": [],
                        //   "hint": null,
                        //   "color": null,
                        //   "depth": 0
                        // },
                        // {
                        //   "name": "samchungy-a@2.0.0",
                        //   "children": [
                        //     {
                        //       "name": "samchungy-dep-a@1.0.0", <- THIS
                        //       "color": "dim",
                        //       "shadow": true
                        //     }
                        //   ],
                        //   "hint": null,
                        //   "color": "bold",
                        //   "depth": 0
                        // }
                        (_a = deps[name]) !== null && _a !== void 0 ? _a : (deps[name] = {
                            version,
                            isRootDep: true,
                        });
                    }
                    else {
                        // Package info is in anther child so we can just ignore
                        // samchungy-dep-a@1.0.0 is in the root (see above example)
                        // {
                        //   "name": "samchungy-b@2.0.0",
                        //   "children": [
                        //     {
                        //       "name": "samchungy-dep-a@2.0.0", <- THIS
                        //       "color": "dim",
                        //       "shadow": true
                        //     },
                        //     {
                        //       "name": "samchungy-dep-a@2.0.0",
                        //       "children": [],
                        //       "hint": null,
                        //       "color": "bold",
                        //       "depth": 0
                        //     }
                        //   ],
                        //   "hint": null,
                        //   "color": "bold",
                        //   "depth": 0
                        // }
                    }
                    return deps;
                }
                // Package is not defined, store it and get the children
                //     {
                //       "name": "samchungy-dep-a@2.0.0",
                //       "children": [],
                //       "hint": null,
                //       "color": "bold",
                //       "depth": 0
                //     }
                (_b = deps[name]) !== null && _b !== void 0 ? _b : (deps[name] = {
                    version,
                    ...(((_c = tree === null || tree === void 0 ? void 0 : tree.children) === null || _c === void 0 ? void 0 : _c.length) && { dependencies: convertTrees(tree.children) }),
                });
                return deps;
            }, {});
        };
        return {
            dependencies: convertTrees(rootTree),
        };
    }
    rebaseLockfile(pathToPackageRoot, lockfile) {
        const fileVersionMatcher = /[^"/]@(?:file:)?((?:\.\/|\.\.\/).*?)[":,]/gm;
        const replacements = [];
        let match;
        // Detect all references and create replacement line strings
        while ((match = fileVersionMatcher.exec(lockfile)) !== null) {
            replacements.push({
                oldRef: match[1],
                newRef: (0, ramda_1.replace)(/\\/g, '/', `${pathToPackageRoot}/${match[1]}`),
            });
        }
        // Replace all lines in lockfile
        return (0, ramda_1.reduce)((__, replacement) => (0, ramda_1.replace)(__, replacement.oldRef, replacement.newRef), lockfile, replacements);
    }
    async install(cwd, extraArgs, useLockfile = true) {
        const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
        const args = useLockfile
            ? ['install', '--frozen-lockfile', '--non-interactive', ...extraArgs]
            : ['install', '--non-interactive', ...extraArgs];
        await (0, utils_1.spawnProcess)(command, args, { cwd });
    }
    // "Yarn install" prunes automatically
    prune(cwd) {
        return this.install(cwd, []);
    }
    async runScripts(cwd, scriptNames) {
        const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
        await Promise.all(scriptNames.map((scriptName) => (0, utils_1.spawnProcess)(command, ['run', scriptName], { cwd })));
    }
}
exports.Yarn = Yarn;
