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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packExternalModules = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const ramda_1 = require("ramda");
const Packagers = __importStar(require("./packagers"));
const utils_1 = require("./utils");
function rebaseFileReferences(pathToPackageRoot, moduleVersion) {
    if (/^(?:file:[^/]{2}|\.\/|\.\.\/)/.test(moduleVersion)) {
        const filePath = (0, ramda_1.replace)(/^file:/, '', moduleVersion);
        return (0, ramda_1.replace)(/\\/g, '/', `${(0, ramda_1.startsWith)('file:', moduleVersion) ? 'file:' : ''}${pathToPackageRoot}/${filePath}`);
    }
    return moduleVersion;
}
/**
 * Add the given modules to a package json's dependencies.
 */
function addModulesToPackageJson(externalModules, packageJson, pathToPackageRoot) {
    (0, ramda_1.forEach)((externalModule) => {
        const splitModule = (0, ramda_1.split)('@', externalModule);
        // If we have a scoped module we have to re-add the @
        if ((0, ramda_1.startsWith)('@', externalModule)) {
            splitModule.splice(0, 1);
            splitModule[0] = '@' + splitModule[0];
        }
        let moduleVersion = (0, ramda_1.join)('@', (0, ramda_1.tail)(splitModule));
        // We have to rebase file references to the target package.json
        moduleVersion = rebaseFileReferences(pathToPackageRoot, moduleVersion);
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.dependencies[(0, ramda_1.head)(splitModule)] = moduleVersion;
    }, externalModules);
}
/**
 * Resolve the needed versions of production dependencies for external modules.
 * @this - The active plugin instance
 */
function getProdModules(externalModules, packageJsonPath, rootPackageJsonPath) {
    const packageJson = require(packageJsonPath);
    const prodModules = [];
    // only process the module stated in dependencies section
    if (!packageJson.dependencies) {
        return [];
    }
    // Get versions of all transient modules
    (0, ramda_1.forEach)((externalModule) => {
        // (1) If not present in Dev Dependencies or Dependencies
        if (!packageJson.dependencies[externalModule.external] &&
            !packageJson.devDependencies[externalModule.external]) {
            this.log.debug(`INFO: Runtime dependency '${externalModule.external}' not found in dependencies or devDependencies. It has been excluded automatically.`);
            return;
        }
        // (2) If present in Dev Dependencies
        if (!packageJson.dependencies[externalModule.external] &&
            packageJson.devDependencies[externalModule.external]) {
            // To minimize the chance of breaking setups we whitelist packages available on AWS here. These are due to the previously missing check
            // most likely set in devDependencies and should not lead to an error now.
            const ignoredDevDependencies = ['aws-sdk'];
            if (!(0, ramda_1.includes)(externalModule.external, ignoredDevDependencies)) {
                // Runtime dependency found in devDependencies but not forcefully excluded
                this.log.error(`ERROR: Runtime dependency '${externalModule.external}' found in devDependencies.`);
                throw new this.serverless.classes.Error(`Serverless-webpack dependency error: ${externalModule.external}.`);
            }
            this.log.debug(`INFO: Runtime dependency '${externalModule.external}' found in devDependencies. It has been excluded automatically.`);
            return;
        }
        // (3) otherwise let's get the version
        // get module package - either from root or local node_modules - will be used for version and peer deps
        const rootModulePackagePath = path_1.default.join(path_1.default.dirname(rootPackageJsonPath), 'node_modules', externalModule.external, 'package.json');
        const localModulePackagePath = path_1.default.join(path_1.default.dirname(packageJsonPath), 'node_modules', externalModule.external, 'package.json');
        const modulePackagePath = fs_extra_1.default.pathExistsSync(localModulePackagePath)
            ? localModulePackagePath
            : fs_extra_1.default.pathExistsSync(rootModulePackagePath)
                ? rootModulePackagePath
                : null;
        const modulePackage = modulePackagePath ? require(modulePackagePath) : {};
        // Get version
        const moduleVersion = packageJson.dependencies[externalModule.external] || modulePackage.version;
        // add dep with version if we have it - versionless otherwise
        if (moduleVersion)
            prodModules.push(`${externalModule.external}@${moduleVersion}`);
        else
            prodModules.push(externalModule.external);
        // Check if the module has any peer dependencies and include them too
        try {
            // find peer dependencies but remove optional ones and excluded ones
            const peerDependencies = modulePackage.peerDependencies;
            const optionalPeerDependencies = Object.keys((0, ramda_1.pickBy)((val) => val.optional, modulePackage.peerDependenciesMeta || {}));
            const peerDependenciesWithoutOptionals = (0, ramda_1.omit)([...optionalPeerDependencies, ...this.buildOptions.exclude], peerDependencies);
            if (!(0, ramda_1.isEmpty)(peerDependenciesWithoutOptionals)) {
                this.log.debug(`Adding explicit non-optionals peers for dependency ${externalModule.external}`);
                const peerModules = getProdModules.call(this, (0, ramda_1.compose)((0, ramda_1.map)(([external]) => ({ external })), ramda_1.toPairs)(peerDependenciesWithoutOptionals), packageJsonPath, rootPackageJsonPath);
                Array.prototype.push.apply(prodModules, peerModules);
            }
        }
        catch (e) {
            this.log.warning(`WARNING: Could not check for peer dependencies of ${externalModule.external}`);
        }
    }, externalModules);
    return prodModules;
}
/**
 * We need a performant algorithm to install the packages for each single
 * function (in case we package individually).
 * (1) We fetch ALL packages needed by ALL functions in a first step
 * and use this as a base npm checkout. The checkout will be done to a
 * separate temporary directory with a package.json that contains everything.
 * (2) For each single compile we copy the whole node_modules to the compile
 * directory and create a (function) compile specific package.json and store
 * it in the compile directory. Now we start npm again there, and npm will just
 * remove the superfluous packages and optimize the remaining dependencies.
 * This will utilize the npm cache at its best and give us the needed results
 * and performance.
 */
async function packExternalModules() {
    const plugins = this.plugins;
    if (plugins &&
        plugins.map((plugin) => plugin.name).includes('node-externals') &&
        fs_extra_1.default.existsSync(path_1.default.resolve(__dirname, '../../esbuild-node-externals/dist/utils.js'))) {
        const { findDependencies, findPackagePaths } = require('esbuild-node-externals/dist/utils');
        this.buildOptions.external = findDependencies({
            dependencies: true,
            packagePaths: findPackagePaths(),
            allowList: [],
        });
    }
    let externals = [];
    // get the list of externals only if exclude is not set to *
    if (this.buildOptions.exclude !== '*' && !this.buildOptions.exclude.includes('*')) {
        externals = (0, ramda_1.without)(this.buildOptions.exclude, this.buildOptions.external);
    }
    if (!externals || !externals.length) {
        return;
    }
    // Read plugin configuration
    // get the root package.json by looking up until we hit a lockfile
    // if this is a yarn workspace, it will be the monorepo package.json
    const rootPackageJsonPath = path_1.default.join((0, utils_1.findProjectRoot)() || '', './package.json');
    // get the local package.json by looking up until we hit a package.json file
    // if this is *not* a yarn workspace, it will be the same as rootPackageJsonPath
    const packageJsonPath = this.buildOptions.packagePath || path_1.default.join((0, utils_1.findUp)('package.json'), './package.json');
    // Determine and create packager
    const packager = await Packagers.get(this.buildOptions.packager);
    // Fetch needed original package.json sections
    const sectionNames = packager.copyPackageSectionNames;
    // Get scripts from packager options
    const packagerScripts = this.buildOptions.packagerOptions
        ? []
            .concat(this.buildOptions.packagerOptions.scripts || [])
            .reduce((scripts, script, index) => {
            scripts[`script${index}`] = script;
            return scripts;
        }, {})
        : {};
    const rootPackageJson = this.serverless.utils.readFileSync(rootPackageJsonPath);
    const isWorkspace = !!rootPackageJson.workspaces;
    const packageJson = isWorkspace
        ? this.serverless.utils.readFileSync(packageJsonPath)
        : rootPackageJson;
    const packageSections = (0, ramda_1.pick)(sectionNames, packageJson);
    if (!(0, ramda_1.isEmpty)(packageSections)) {
        this.log.debug(`Using package.json sections ${(0, ramda_1.join)(', ', (0, ramda_1.keys)(packageSections))}`);
    }
    // Get first level dependency graph
    this.log.debug(`Fetch dependency graph from ${packageJson}`);
    // (1) Generate dependency composition
    const externalModules = (0, ramda_1.map)((external) => ({ external }), externals);
    const compositeModules = (0, ramda_1.uniq)(getProdModules.call(this, externalModules, packageJsonPath, rootPackageJsonPath));
    if ((0, ramda_1.isEmpty)(compositeModules)) {
        // The compiled code does not reference any external modules at all
        this.log.warning('No external modules needed');
        return;
    }
    // (1.a) Install all needed modules
    const compositeModulePath = this.buildDirPath;
    const compositePackageJson = path_1.default.join(compositeModulePath, 'package.json');
    // (1.a.1) Create a package.json
    const compositePackage = (0, ramda_1.mergeRight)({
        name: this.serverless.service.service,
        version: '1.0.0',
        description: `Packaged externals for ${this.serverless.service.service}`,
        private: true,
        scripts: packagerScripts,
    }, packageSections);
    const relativePath = path_1.default.relative(compositeModulePath, path_1.default.dirname(packageJsonPath));
    addModulesToPackageJson(compositeModules, compositePackage, relativePath);
    this.serverless.utils.writeFileSync(compositePackageJson, JSON.stringify(compositePackage, null, 2));
    // (1.a.2) Copy package-lock.json if it exists, to prevent unwanted upgrades
    const packageLockPath = path_1.default.join(path_1.default.dirname(packageJsonPath), packager.lockfileName);
    const exists = await fs_extra_1.default.pathExists(packageLockPath);
    if (exists) {
        this.log.verbose('Package lock found - Using locked versions');
        try {
            let packageLockFile = this.serverless.utils.readFileSync(packageLockPath);
            packageLockFile = packager.rebaseLockfile(relativePath, packageLockFile);
            if ((0, ramda_1.is)(Object)(packageLockFile)) {
                packageLockFile = JSON.stringify(packageLockFile, null, 2);
            }
            this.serverless.utils.writeFileSync(path_1.default.join(compositeModulePath, packager.lockfileName), packageLockFile);
        }
        catch (err) {
            this.log.warning(`Warning: Could not read lock file: ${err.message}`);
        }
    }
    // GOOGLE: Copy modules only if not google-cloud-functions
    // GCF Auto installs the package json
    if ((0, ramda_1.path)(['service', 'provider', 'name'], this.serverless) === 'google') {
        return;
    }
    const start = Date.now();
    this.log.verbose('Packing external modules: ' + compositeModules.join(', '));
    const installExtraArgs = this.buildOptions.installExtraArgs;
    await packager.install(compositeModulePath, installExtraArgs, exists);
    this.log.debug(`Package took [${Date.now() - start} ms]`);
    // Prune extraneous packages - removes not needed ones
    const startPrune = Date.now();
    await packager.prune(compositeModulePath);
    this.log.debug(`Prune: ${compositeModulePath} [${Date.now() - startPrune} ms]`);
    // Run packager scripts
    if (Object.keys(packagerScripts).length > 0) {
        const startScripts = Date.now();
        await packager.runScripts(this.buildDirPath, Object.keys(packagerScripts));
        this.log.debug(`Packager scripts took [${Date.now() - startScripts} ms].\nExecuted scripts: ${Object.values(packagerScripts).map((script) => `\n  ${script}`)}`);
    }
}
exports.packExternalModules = packExternalModules;
