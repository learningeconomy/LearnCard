"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundle = void 0;
const esbuild_1 = require("esbuild");
const fs_extra_1 = __importDefault(require("fs-extra"));
const p_map_1 = __importDefault(require("p-map"));
const path_1 = __importDefault(require("path"));
const ramda_1 = require("ramda");
const utils_1 = require("./utils");
async function bundle(incremental = false) {
    this.prepare();
    this.log.verbose(`Compiling to ${this.buildOptions.target} bundle with esbuild...`);
    if (this.buildOptions.disableIncremental === true) {
        incremental = false;
    }
    const config = {
        ...this.buildOptions,
        external: [
            ...this.buildOptions.external,
            ...(this.buildOptions.exclude === '*' || this.buildOptions.exclude.includes('*')
                ? []
                : this.buildOptions.exclude),
        ],
        incremental,
        plugins: this.plugins,
    };
    // esbuild v0.7.0 introduced config options validation, so I have to delete plugin specific options from esbuild config.
    delete config['concurrency'];
    delete config['exclude'];
    delete config['nativeZip'];
    delete config['packager'];
    delete config['packagePath'];
    delete config['watch'];
    delete config['keepOutputDirectory'];
    delete config['packagerOptions'];
    delete config['installExtraArgs'];
    delete config['disableIncremental'];
    /** Build the files */
    const bundleMapper = async (entry) => {
        const bundlePath = entry.slice(0, entry.lastIndexOf('.')) + '.js';
        // check cache
        if (this.buildCache) {
            const { result } = this.buildCache[entry];
            if (result === null || result === void 0 ? void 0 : result.rebuild) {
                await result.rebuild();
                return { bundlePath, entry, result };
            }
        }
        const result = await (0, esbuild_1.build)({
            ...config,
            entryPoints: [entry],
            outdir: path_1.default.join(this.buildDirPath, path_1.default.dirname(entry)),
        });
        if (config.metafile) {
            fs_extra_1.default.writeFileSync(path_1.default.join(this.buildDirPath, `${(0, utils_1.trimExtension)(entry)}-meta.json`), JSON.stringify(result.metafile, null, 2));
        }
        return { bundlePath, entry, result };
    };
    // Files can contain multiple handlers for multiple functions, we want to get only the unique ones
    const uniqueFiles = (0, ramda_1.uniq)(this.functionEntries.map(({ entry }) => entry));
    this.log.verbose(`Compiling with concurrency: ${this.buildOptions.concurrency}`);
    const fileBuildResults = await (0, p_map_1.default)(uniqueFiles, bundleMapper, {
        concurrency: this.buildOptions.concurrency,
    });
    // Create a cache with entry as key
    this.buildCache = fileBuildResults.reduce((acc, fileBuildResult) => {
        acc[fileBuildResult.entry] = fileBuildResult;
        return acc;
    }, {});
    // Map function entries back to bundles
    this.buildResults = this.functionEntries.map(({ entry, func, functionAlias }) => {
        const { bundlePath } = this.buildCache[entry];
        return { bundlePath, func, functionAlias };
    });
    this.log.verbose('Compiling completed.');
}
exports.bundle = bundle;
