"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServerlessV3LoggerFromLegacyLogger = exports.providerRuntimeMatcher = exports.doSharePath = exports.getDepsFromBundle = exports.flatDep = exports.extractFunctionEntries = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const ramda_1 = require("ramda");
const string_prototype_matchall_1 = __importDefault(require("string.prototype.matchall"));
function extractFunctionEntries(cwd, provider, functions) {
    // The Google provider will use the entrypoint not from the definition of the
    // handler function, but instead from the package.json:main field, or via a
    // index.js file. This check reads the current package.json in the same way
    // that we already read the tsconfig.json file, by inspecting the current
    // working directory. If the packageFile does not contain a valid main, then
    // it instead selects the index.js file.
    if (provider === 'google') {
        const packageFilePath = path_1.default.join(cwd, 'package.json');
        if (fs_extra_1.default.existsSync(packageFilePath)) {
            // Load in the package.json file.
            const packageFile = JSON.parse(fs_extra_1.default.readFileSync(packageFilePath).toString());
            // Either grab the package.json:main field, or use the index.ts file.
            // (This will be transpiled to index.js).
            const entry = packageFile.main ? packageFile.main.replace(/\.js$/, '.ts') : 'index.ts';
            // Check that the file indeed exists.
            if (!fs_extra_1.default.existsSync(path_1.default.join(cwd, entry))) {
                console.log(`Cannot locate entrypoint, ${entry} not found`);
                throw new Error('Compilation failed');
            }
            return [{ entry, func: null }];
        }
    }
    return Object.keys(functions).map((functionAlias) => {
        const func = functions[functionAlias];
        const h = func.handler;
        const fnName = path_1.default.extname(h);
        const fnNameLastAppearanceIndex = h.lastIndexOf(fnName);
        // replace only last instance to allow the same name for file and handler
        const fileName = h.substring(0, fnNameLastAppearanceIndex);
        const extensions = ['.ts', '.js'];
        for (const extension of extensions) {
            // Check if the .{extension} files exists. If so return that to watch
            if (fs_extra_1.default.existsSync(path_1.default.join(cwd, fileName + extension))) {
                const entry = path_1.default.relative(cwd, fileName + extension);
                return {
                    entry: os_1.default.platform() === 'win32' ? entry.replace(/\\/g, '/') : entry,
                    func,
                    functionAlias,
                };
            }
        }
        // Can't find the files. Watch will have an exception anyway. So throw one with error.
        console.log(`Cannot locate handler - ${fileName} not found`);
        throw new Error('Compilation failed. Please ensure you have an index file with ext .ts or .js, or have a path listed as main key in package.json');
    });
}
exports.extractFunctionEntries = extractFunctionEntries;
/**
 * Takes a dependency graph and returns a flat list of required production dependencies for all or the filtered deps
 * @param root the root of the dependency tree
 * @param rootDeps array of top level root dependencies to whitelist
 */
const flatDep = (root, rootDepsFilter) => {
    const flattenedDependencies = new Set();
    /**
     *
     * @param deps the current tree
     * @param filter the dependencies to get from this tree
     */
    const recursiveFind = (deps, filter) => {
        if (!deps)
            return;
        Object.entries(deps).forEach(([depName, details]) => {
            // only for root level dependencies
            if (filter && !filter.includes(depName))
                return;
            if (details.isRootDep || filter) {
                // We already have this root dep and it's dependencies - skip this iteration
                if (flattenedDependencies.has(depName))
                    return;
                flattenedDependencies.add(depName);
                recursiveFind(root[depName].dependencies);
                return;
            }
            // This is a nested dependency and will be included by default when we include it's parent
            // We just need to check if we fulfil all it's dependencies
            recursiveFind(details.dependencies);
        });
    };
    recursiveFind(root, rootDepsFilter);
    return Array.from(flattenedDependencies);
};
exports.flatDep = flatDep;
/**
 * Extracts the base package from a package string taking scope into consideration
 * @example getBaseDep('@scope/package/register') returns '@scope/package'
 * @example getBaseDep('package/register') returns 'package'
 * @example getBaseDep('package') returns 'package'
 * @param path
 */
const getBaseDep = (path) => /^@[^/]+\/[^/\n]+|^[^/\n]+/.exec(path)[0];
/**
 * Extracts the list of dependencies that appear in a bundle as `require(XXX)`
 * @param bundlePath Absolute path to a bundled JS file
 */
const getDepsFromBundle = (bundlePath, platform) => {
    const bundleContent = fs_extra_1.default.readFileSync(bundlePath, 'utf8');
    const deps = platform === 'neutral'
        ? Array.from((0, string_prototype_matchall_1.default)(bundleContent, /from\s?"(.*?)";|import\s?"(.*?)";/gim)).map((match) => match[1] || match[2])
        : Array.from((0, string_prototype_matchall_1.default)(bundleContent, /require\("(.*?)"\)/gim)).map((match) => match[1]);
    return (0, ramda_1.uniq)(deps.map((dep) => getBaseDep(dep)));
};
exports.getDepsFromBundle = getDepsFromBundle;
const doSharePath = (child, parent) => {
    if (child === parent)
        return true;
    const parentTokens = parent.split('/');
    const childToken = child.split('/');
    return parentTokens.every((t, i) => childToken[i] === t);
};
exports.doSharePath = doSharePath;
exports.providerRuntimeMatcher = Object.freeze({
    aws: {
        'nodejs16.x': 'node16',
        'nodejs14.x': 'node14',
        'nodejs12.x': 'node12',
    },
});
const buildServerlessV3LoggerFromLegacyLogger = (legacyLogger, verbose) => ({
    error: legacyLogger,
    warning: legacyLogger,
    notice: legacyLogger,
    info: legacyLogger,
    debug: verbose ? legacyLogger : () => null,
    verbose: legacyLogger,
    success: legacyLogger,
});
exports.buildServerlessV3LoggerFromLegacyLogger = buildServerlessV3LoggerFromLegacyLogger;
