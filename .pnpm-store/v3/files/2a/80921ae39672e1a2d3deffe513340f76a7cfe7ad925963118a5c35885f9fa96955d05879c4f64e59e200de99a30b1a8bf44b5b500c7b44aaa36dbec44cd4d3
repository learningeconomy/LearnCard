"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_extra_1 = __importDefault(require("fs-extra"));
const globby_1 = __importDefault(require("globby"));
const path_1 = __importDefault(require("path"));
const ramda_1 = require("ramda");
const chokidar_1 = __importDefault(require("chokidar"));
const anymatch_1 = __importDefault(require("anymatch"));
const helper_1 = require("./helper");
const pack_externals_1 = require("./pack-externals");
const pack_1 = require("./pack");
const pre_offline_1 = require("./pre-offline");
const pre_local_1 = require("./pre-local");
const bundle_1 = require("./bundle");
const constants_1 = require("./constants");
function updateFile(op, src, dest) {
    if (['add', 'change', 'addDir'].includes(op)) {
        fs_extra_1.default.copySync(src, dest, {
            dereference: true,
            errorOnExist: false,
            preserveTimestamps: true,
            recursive: true,
        });
        return;
    }
    if (['unlink', 'unlinkDir'].includes(op)) {
        fs_extra_1.default.removeSync(dest);
    }
}
class EsbuildServerlessPlugin {
    constructor(serverless, options, logging) {
        this.getCachedOptions = (0, ramda_1.memoizeWith)((0, ramda_1.always)('cache'), () => {
            var _a, _b, _c, _d;
            const DEFAULT_BUILD_OPTIONS = {
                concurrency: Infinity,
                bundle: true,
                target: 'node12',
                external: [],
                exclude: ['aws-sdk'],
                nativeZip: false,
                packager: 'npm',
                installExtraArgs: [],
                watch: {
                    pattern: './**/*.(js|ts)',
                    ignore: [this.outputWorkFolder, 'dist', 'node_modules', this.outputBuildFolder],
                },
                keepOutputDirectory: false,
                packagerOptions: {},
                platform: 'node',
            };
            const runtimeMatcher = helper_1.providerRuntimeMatcher[this.serverless.service.provider.name];
            const target = runtimeMatcher === null || runtimeMatcher === void 0 ? void 0 : runtimeMatcher[this.serverless.service.provider.runtime];
            const resolvedOptions = {
                ...(target ? { target } : {}),
            };
            const withDefaultOptions = (0, ramda_1.mergeRight)(DEFAULT_BUILD_OPTIONS);
            const withResolvedOptions = (0, ramda_1.mergeRight)(withDefaultOptions(resolvedOptions));
            const configPath = (_b = (_a = this.serverless.service.custom) === null || _a === void 0 ? void 0 : _a.esbuild) === null || _b === void 0 ? void 0 : _b.config;
            let config;
            if (configPath) {
                config = require(path_1.default.join(this.serviceDirPath, configPath));
            }
            return withResolvedOptions(config ? config(this.serverless) : (_d = (_c = this.serverless.service.custom) === null || _c === void 0 ? void 0 : _c.esbuild) !== null && _d !== void 0 ? _d : {});
        });
        this.serverless = serverless;
        this.options = options;
        this.log =
            (logging === null || logging === void 0 ? void 0 : logging.log) ||
                (0, helper_1.buildServerlessV3LoggerFromLegacyLogger)(this.serverless.cli.log, this.options.verbose);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore old versions use servicePath, new versions serviceDir. Types will use only one of them
        this.serviceDirPath = this.serverless.config.serviceDir || this.serverless.config.servicePath;
        this.packExternalModules = pack_externals_1.packExternalModules.bind(this);
        this.pack = pack_1.pack.bind(this);
        this.preOffline = pre_offline_1.preOffline.bind(this);
        this.preLocal = pre_local_1.preLocal.bind(this);
        this.bundle = bundle_1.bundle.bind(this);
        this.outputWorkFolder = this.buildOptions.outputWorkFolder || constants_1.WORK_FOLDER;
        this.outputBuildFolder = this.buildOptions.outputBuildFolder || constants_1.BUILD_FOLDER;
        this.workDirPath = path_1.default.join(this.serviceDirPath, this.outputWorkFolder);
        this.buildDirPath = path_1.default.join(this.workDirPath, this.outputBuildFolder);
        this.hooks = {
            'before:run:run': async () => {
                await this.bundle();
                await this.packExternalModules();
                await this.copyExtras();
            },
            'before:offline:start': async () => {
                await this.bundle(true);
                await this.packExternalModules();
                await this.copyExtras();
                await this.preOffline();
                this.watch();
            },
            'before:offline:start:init': async () => {
                await this.bundle(true);
                await this.packExternalModules();
                await this.copyExtras();
                await this.preOffline();
                this.watch();
            },
            'before:package:createDeploymentArtifacts': async () => {
                await this.bundle();
                await this.packExternalModules();
                await this.copyExtras();
                await this.pack();
            },
            'after:package:createDeploymentArtifacts': async () => {
                await this.cleanup();
            },
            'before:deploy:function:packageFunction': async () => {
                await this.bundle();
                await this.packExternalModules();
                await this.copyExtras();
                await this.pack();
            },
            'after:deploy:function:packageFunction': async () => {
                await this.cleanup();
            },
            'before:invoke:local:invoke': async () => {
                await this.bundle();
                await this.packExternalModules();
                await this.copyExtras();
                await this.preLocal();
            },
        };
    }
    /**
     * Checks if the runtime for the given function is nodejs.
     * If the runtime is not set , checks the global runtime.
     * @param {Serverless.FunctionDefinitionHandler} func the function to be checked
     * @returns {boolean} true if the function/global runtime is nodejs; false, otherwise
     */
    isNodeFunction(func) {
        const runtime = func.runtime || this.serverless.service.provider.runtime;
        const runtimeMatcher = helper_1.providerRuntimeMatcher[this.serverless.service.provider.name];
        return Boolean(runtimeMatcher === null || runtimeMatcher === void 0 ? void 0 : runtimeMatcher[runtime]);
    }
    /**
     * Checks if the function has a handler
     * @param {Serverless.FunctionDefinitionHandler | Serverless.FunctionDefinitionImage} func the function to be checked
     * @returns {boolean} true if the function has a handler
     */
    isFunctionDefinitionHandler(func) {
        var _a;
        return Boolean((_a = func) === null || _a === void 0 ? void 0 : _a.handler);
    }
    get functions() {
        const functions = this.options.function
            ? {
                [this.options.function]: this.serverless.service.getFunction(this.options.function),
            }
            : this.serverless.service.functions;
        // ignore all functions with a different runtime than nodejs:
        const nodeFunctions = {};
        for (const [functionAlias, fn] of Object.entries(functions)) {
            if (this.isFunctionDefinitionHandler(fn) && this.isNodeFunction(fn)) {
                nodeFunctions[functionAlias] = fn;
            }
        }
        return nodeFunctions;
    }
    get plugins() {
        if (!this.buildOptions.plugins)
            return;
        if (Array.isArray(this.buildOptions.plugins)) {
            return this.buildOptions.plugins;
        }
        const plugins = require(path_1.default.join(this.serviceDirPath, this.buildOptions.plugins));
        if (typeof plugins === 'function') {
            return plugins(this.serverless);
        }
        return plugins;
    }
    get packagePatterns() {
        const { service } = this.serverless;
        const patterns = [];
        const ignored = [];
        for (const pattern of service.package.patterns) {
            if (pattern.startsWith('!')) {
                ignored.push(pattern.slice(1));
            }
            else {
                patterns.push(pattern);
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, fn] of Object.entries(this.functions)) {
            if (fn.package.patterns.length === 0) {
                continue;
            }
            for (const pattern of fn.package.patterns) {
                if (pattern.startsWith('!')) {
                    ignored.push(pattern.slice(1));
                }
                else {
                    patterns.push(pattern);
                }
            }
        }
        return { patterns, ignored };
    }
    get buildOptions() {
        return this.getCachedOptions();
    }
    get functionEntries() {
        return (0, helper_1.extractFunctionEntries)(this.serviceDirPath, this.serverless.service.provider.name, this.functions);
    }
    async watch() {
        let defaultPatterns = this.buildOptions.watch.pattern;
        const options = {
            ignored: this.buildOptions.watch.ignore || [],
            awaitWriteFinish: true,
            ignoreInitial: true,
        };
        if (!Array.isArray(defaultPatterns)) {
            defaultPatterns = [defaultPatterns];
        }
        if (!Array.isArray(options.ignored)) {
            options.ignored = [options.ignored];
        }
        const { patterns, ignored } = this.packagePatterns;
        defaultPatterns = [...defaultPatterns, ...patterns];
        options.ignored = [...options.ignored, ...ignored];
        chokidar_1.default.watch(defaultPatterns, options).on('all', (eventName, srcPath) => this.bundle(true)
            .then(() => this.updateFile(eventName, srcPath))
            .then(() => this.log.verbose('Watching files for changes...'))
            .catch(() => this.log.error('Bundle error, waiting for a file change to reload...')));
    }
    prepare() {
        var _a, _b, _c, _d, _e, _f;
        fs_extra_1.default.mkdirpSync(this.buildDirPath);
        fs_extra_1.default.mkdirpSync(path_1.default.join(this.workDirPath, constants_1.SERVERLESS_FOLDER));
        // exclude serverless-esbuild
        this.serverless.service.package = {
            ...(this.serverless.service.package || {}),
            patterns: [
                ...new Set([
                    ...(((_a = this.serverless.service.package) === null || _a === void 0 ? void 0 : _a.include) || []),
                    ...(((_b = this.serverless.service.package) === null || _b === void 0 ? void 0 : _b.exclude) || []).map((0, ramda_1.concat)('!')),
                    ...(((_c = this.serverless.service.package) === null || _c === void 0 ? void 0 : _c.patterns) || []),
                    '!node_modules/serverless-esbuild',
                ]),
            ],
        };
        for (const fn of Object.values(this.functions)) {
            fn.package = {
                ...(fn.package || {}),
                patterns: [
                    ...new Set([
                        ...(((_d = fn.package) === null || _d === void 0 ? void 0 : _d.include) || []),
                        ...(((_e = fn.package) === null || _e === void 0 ? void 0 : _e.exclude) || []).map((0, ramda_1.concat)('!')),
                        ...(((_f = fn.package) === null || _f === void 0 ? void 0 : _f.patterns) || []),
                    ]),
                ],
            };
        }
    }
    async updateFile(op, filename) {
        const { service } = this.serverless;
        if (service.package.patterns.length > 0 &&
            (0, anymatch_1.default)(service.package.patterns.filter((p) => !p.startsWith('!')), filename)) {
            const destFileName = path_1.default.resolve(path_1.default.join(this.buildDirPath, filename));
            updateFile(op, path_1.default.resolve(filename), destFileName);
            return;
        }
        for (const [functionAlias, fn] of Object.entries(this.functions)) {
            if (fn.package.patterns.length === 0) {
                continue;
            }
            if ((0, anymatch_1.default)(fn.package.patterns.filter((p) => !p.startsWith('!')), filename)) {
                const destFileName = path_1.default.resolve(path_1.default.join(this.buildDirPath, `${constants_1.ONLY_PREFIX}${functionAlias}`, filename));
                updateFile(op, path_1.default.resolve(filename), destFileName);
                return;
            }
        }
    }
    /** Link or copy extras such as node_modules or package.patterns definitions */
    async copyExtras() {
        const { service } = this.serverless;
        // include any "extras" from the "patterns" section
        if (service.package.patterns.length > 0) {
            const files = await (0, globby_1.default)(service.package.patterns);
            for (const filename of files) {
                const destFileName = path_1.default.resolve(path_1.default.join(this.buildDirPath, filename));
                updateFile('add', path_1.default.resolve(filename), destFileName);
            }
        }
        // include any "extras" from the individual function "patterns" section
        for (const [functionAlias, fn] of Object.entries(this.functions)) {
            if (fn.package.patterns.length === 0) {
                continue;
            }
            const files = await (0, globby_1.default)(fn.package.patterns);
            for (const filename of files) {
                const destFileName = path_1.default.resolve(path_1.default.join(this.buildDirPath, `${constants_1.ONLY_PREFIX}${functionAlias}`, filename));
                updateFile('add', path_1.default.resolve(filename), destFileName);
            }
        }
    }
    /**
     * Move built code to the serverless folder, taking into account individual
     * packaging preferences.
     */
    async moveArtifacts() {
        const { service } = this.serverless;
        await fs_extra_1.default.copy(path_1.default.join(this.workDirPath, constants_1.SERVERLESS_FOLDER), path_1.default.join(this.serviceDirPath, constants_1.SERVERLESS_FOLDER));
        if (service.package.individually || this.options.function) {
            Object.values(this.functions).forEach((func) => {
                func.package.artifact = path_1.default.join(this.serviceDirPath, constants_1.SERVERLESS_FOLDER, path_1.default.basename(func.package.artifact));
            });
            return;
        }
        service.package.artifact = path_1.default.join(this.serviceDirPath, constants_1.SERVERLESS_FOLDER, path_1.default.basename(service.package.artifact));
    }
    async cleanup() {
        await this.moveArtifacts();
        // Remove temp build folder
        if (!this.buildOptions.keepOutputDirectory) {
            fs_extra_1.default.removeSync(path_1.default.join(this.workDirPath));
        }
    }
}
module.exports = EsbuildServerlessPlugin;
