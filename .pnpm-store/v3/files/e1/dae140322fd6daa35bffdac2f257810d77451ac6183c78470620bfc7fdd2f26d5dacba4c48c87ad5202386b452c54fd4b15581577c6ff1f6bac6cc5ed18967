"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptPlugin = void 0;
const path = require("path");
const fs = require("fs-extra");
const _ = require("lodash");
const globby = require("globby");
const typescript = require("./typescript");
const watchFiles_1 = require("./watchFiles");
const SERVERLESS_FOLDER = '.serverless';
const BUILD_FOLDER = '.build';
class TypeScriptPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.commands = {
            invoke: {
                commands: {
                    local: {
                        options: {
                            watch: {
                                type: 'boolean',
                                usage: 'Watch file changes and re-invoke automatically the function'
                            }
                        }
                    }
                }
            }
        };
        this.hooks = {
            'before:run:run': () => __awaiter(this, void 0, void 0, function* () {
                yield this.compileTs();
                yield this.copyExtras();
                yield this.copyDependencies();
            }),
            'before:offline:start': () => __awaiter(this, void 0, void 0, function* () {
                yield this.compileTs();
                yield this.copyExtras();
                yield this.copyDependencies();
                this.watchAll();
            }),
            'before:offline:start:init': () => __awaiter(this, void 0, void 0, function* () {
                yield this.compileTs();
                yield this.copyExtras();
                yield this.copyDependencies();
                this.watchAll();
            }),
            'before:package:createDeploymentArtifacts': () => __awaiter(this, void 0, void 0, function* () {
                yield this.compileTs();
                yield this.copyExtras();
                yield this.copyDependencies(true);
            }),
            'after:package:createDeploymentArtifacts': () => __awaiter(this, void 0, void 0, function* () {
                yield this.cleanup();
            }),
            'before:deploy:function:packageFunction': () => __awaiter(this, void 0, void 0, function* () {
                yield this.compileTs();
                yield this.copyExtras();
                yield this.copyDependencies(true);
            }),
            'after:deploy:function:packageFunction': () => __awaiter(this, void 0, void 0, function* () {
                yield this.cleanup();
            }),
            'before:invoke:local:invoke': () => __awaiter(this, void 0, void 0, function* () {
                const emitedFiles = yield this.compileTs();
                yield this.copyExtras();
                yield this.copyDependencies();
                if (this.isWatching) {
                    emitedFiles.forEach(filename => {
                        const module = require.resolve(path.resolve(this.originalServicePath, filename));
                        delete require.cache[module];
                    });
                }
            }),
            'after:invoke:local:invoke': () => __awaiter(this, void 0, void 0, function* () {
                if (this.options.watch) {
                    yield this.watchFunction();
                }
            })
        };
    }
    get functions() {
        const { options } = this;
        const { service } = this.serverless;
        if (options.function) {
            return {
                [options.function]: service.functions[this.options.function]
            };
        }
        return service.functions;
    }
    get rootFileNames() {
        return typescript.extractFileNames(this.originalServicePath, this.serverless.service.provider.name, this.functions);
    }
    prepare() {
        // exclude serverless-plugin-typescript
        for (const fnName in this.functions) {
            const fn = this.functions[fnName];
            fn.package = fn.package || {
                exclude: [],
                include: [],
                patterns: []
            };
            // Add plugin to excluded packages or an empty array if exclude is undefined
            fn.package.exclude = _.uniq([...fn.package.exclude || [], 'node_modules/serverless-plugin-typescript']);
        }
    }
    watchFunction() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isWatching) {
                return;
            }
            this.serverless.cli.log(`Watch function ${this.options.function}...`);
            this.serverless.cli.log('Waiting for changes...');
            this.isWatching = true;
            yield new Promise((resolve, reject) => {
                watchFiles_1.watchFiles(this.rootFileNames, this.originalServicePath, () => {
                    this.serverless.pluginManager.spawn('invoke:local').catch(reject);
                });
            });
        });
    }
    watchAll() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isWatching) {
                return;
            }
            this.serverless.cli.log(`Watching typescript files...`);
            this.isWatching = true;
            watchFiles_1.watchFiles(this.rootFileNames, this.originalServicePath, this.compileTs.bind(this));
        });
    }
    compileTs() {
        return __awaiter(this, void 0, void 0, function* () {
            this.prepare();
            this.serverless.cli.log('Compiling with Typescript...');
            if (!this.originalServicePath) {
                // Save original service path and functions
                this.originalServicePath = this.serverless.config.servicePath;
                // Fake service path so that serverless will know what to zip
                this.serverless.config.servicePath = path.join(this.originalServicePath, BUILD_FOLDER);
            }
            let tsConfigFileLocation;
            if (this.serverless.service.custom !== undefined
                && this.serverless.service.custom.serverlessPluginTypescript !== undefined) {
                tsConfigFileLocation = this.serverless.service.custom.serverlessPluginTypescript.tsConfigFileLocation;
            }
            const tsconfig = typescript.getTypescriptConfig(this.originalServicePath, tsConfigFileLocation, this.isWatching ? null : this.serverless.cli);
            tsconfig.outDir = BUILD_FOLDER;
            const emitedFiles = yield typescript.run(this.rootFileNames, tsconfig);
            this.serverless.cli.log('Typescript compiled.');
            return emitedFiles;
        });
    }
    /** Link or copy extras such as node_modules or package.patterns definitions */
    copyExtras() {
        return __awaiter(this, void 0, void 0, function* () {
            const { service } = this.serverless;
            const patterns = [...(service.package.include || []), ...(service.package.patterns || [])];
            // include any "extras" from the "include" section
            if (patterns.length > 0) {
                const files = yield globby(patterns);
                for (const filename of files) {
                    const destFileName = path.resolve(path.join(BUILD_FOLDER, filename));
                    const dirname = path.dirname(destFileName);
                    if (!fs.existsSync(dirname)) {
                        fs.mkdirpSync(dirname);
                    }
                    if (!fs.existsSync(destFileName)) {
                        fs.copySync(path.resolve(filename), path.resolve(path.join(BUILD_FOLDER, filename)));
                    }
                }
            }
        });
    }
    /**
     * Copy the `node_modules` folder and `package.json` files to the output
     * directory.
     * @param isPackaging Provided if serverless is packaging the service for deployment
     */
    copyDependencies(isPackaging = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const outPkgPath = path.resolve(path.join(BUILD_FOLDER, 'package.json'));
            const outModulesPath = path.resolve(path.join(BUILD_FOLDER, 'node_modules'));
            // copy development dependencies during packaging
            if (isPackaging) {
                if (fs.existsSync(outModulesPath)) {
                    fs.unlinkSync(outModulesPath);
                }
                fs.copySync(path.resolve('node_modules'), path.resolve(path.join(BUILD_FOLDER, 'node_modules')));
            }
            else {
                if (!fs.existsSync(outModulesPath)) {
                    yield this.linkOrCopy(path.resolve('node_modules'), outModulesPath, 'junction');
                }
            }
            // copy/link package.json
            if (!fs.existsSync(outPkgPath)) {
                yield this.linkOrCopy(path.resolve('package.json'), outPkgPath, 'file');
            }
        });
    }
    /**
     * Move built code to the serverless folder, taking into account individual
     * packaging preferences.
     */
    moveArtifacts() {
        return __awaiter(this, void 0, void 0, function* () {
            const { service } = this.serverless;
            yield fs.copy(path.join(this.originalServicePath, BUILD_FOLDER, SERVERLESS_FOLDER), path.join(this.originalServicePath, SERVERLESS_FOLDER));
            const layerNames = service.getAllLayers();
            layerNames.forEach(name => {
                service.layers[name].package.artifact = path.join(this.originalServicePath, SERVERLESS_FOLDER, path.basename(service.layers[name].package.artifact));
            });
            if (this.options.function) {
                const fn = service.functions[this.options.function];
                fn.package.artifact = path.join(this.originalServicePath, SERVERLESS_FOLDER, path.basename(fn.package.artifact));
                return;
            }
            if (service.package.individually) {
                const functionNames = service.getAllFunctions();
                functionNames.forEach(name => {
                    service.functions[name].package.artifact = path.join(this.originalServicePath, SERVERLESS_FOLDER, path.basename(service.functions[name].package.artifact));
                });
                return;
            }
            service.package.artifact = path.join(this.originalServicePath, SERVERLESS_FOLDER, path.basename(service.package.artifact));
        });
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.moveArtifacts();
            // Restore service path
            this.serverless.config.servicePath = this.originalServicePath;
            // Remove temp build folder
            fs.removeSync(path.join(this.originalServicePath, BUILD_FOLDER));
        });
    }
    /**
     * Attempt to symlink a given path or directory and copy if it fails with an
     * `EPERM` error.
     */
    linkOrCopy(srcPath, dstPath, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return fs.symlink(srcPath, dstPath, type)
                .catch(error => {
                if (error.code === 'EPERM' && error.errno === -4048) {
                    return fs.copy(srcPath, dstPath);
                }
                throw error;
            });
        });
    }
}
exports.TypeScriptPlugin = TypeScriptPlugin;
module.exports = TypeScriptPlugin;
//# sourceMappingURL=index.js.map