"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copy = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const globby_1 = __importDefault(require("globby"));
function keepStructureCopyHandler(outDir, rawFromPath, globbedFromPath, baseToPath, verbose = false, dryRun = false) {
    // we keep structure only when input from path ends with /**/*(.ext)
    // for \/* only, we use simple merge copy handler
    // we only support /**/* now
    // and /**/*.js?
    for (const rawFrom of rawFromPath) {
        const { dir } = path_1.default.parse(rawFrom);
        // be default, when ends with /*, glob doesnot expand directories
        // avoid use override option `expandDirectories` and use `/*`
        if (!dir.endsWith('/**')) {
            verboseLog(`You're using ${chalk_1.default.white('Keep-Structure')} mode for the assets paire which its ${chalk_1.default.white('from')} path doesnot ends with ${chalk_1.default.white('/**/*(.ext)')}, fallback to ${chalk_1.default.white('Merge-Structure')} mode`, verbose);
            mergeCopyHandler(outDir, globbedFromPath, baseToPath, verbose);
        }
        const startFragment = dir.replace(`/**`, '');
        const [, preservedDirStructure] = globbedFromPath.split(startFragment);
        const sourcePath = path_1.default.resolve(globbedFromPath);
        const composedDistDirPath = path_1.default.resolve(outDir, baseToPath, preservedDirStructure.slice(1));
        !dryRun && fs_extra_1.default.ensureDirSync(path_1.default.dirname(composedDistDirPath));
        !dryRun && fs_extra_1.default.copyFileSync(sourcePath, composedDistDirPath);
        verboseLog(`${dryRun ? chalk_1.default.white('[DryRun] ') : ''}File copied: ${chalk_1.default.white(sourcePath)} -> ${chalk_1.default.white(composedDistDirPath)}`, verbose);
    }
}
function mergeCopyHandler(outDir, from, to, verbose = false, dryRun = false) {
    // absolute file path for each pair's from
    const sourcePath = path_1.default.resolve(from);
    const parsedFromPath = path_1.default.parse(from);
    const parsedToPath = path_1.default.parse(to);
    // if we specified file name in to path, we use its basename
    // or, we make the from path base as default
    const distBaseName = parsedToPath.ext.length
        ? parsedToPath.base
        : parsedFromPath.base;
    // if user specified file name in `to` path:
    // case: ./file.ext, the parsed.dir will be '.' we need to use empty dist dir: ''
    // case: ./dir/file.ext, the parsed.dir will be './dir' and we need to use './dir'
    const distDir = parsedToPath.dir === '.' ? '' : parsedToPath.dir;
    const distPath = path_1.default.resolve(outDir, distDir, distBaseName);
    !dryRun && fs_extra_1.default.ensureDirSync(path_1.default.dirname(distPath));
    !dryRun && fs_extra_1.default.copyFileSync(sourcePath, distPath);
    verboseLog(`${dryRun ? chalk_1.default.white('[DryRun] ') : ''}File copied: ${chalk_1.default.white(sourcePath)} -> ${chalk_1.default.white(distPath)}`, verbose);
}
function ensureArray(item) {
    return Array.isArray(item) ? item : [item];
}
function verboseLog(msg, verbose, lineBefore = false) {
    if (!verbose) {
        return;
    }
    console.log(chalk_1.default.blue(lineBefore ? '\ni' : 'i'), msg);
}
function formatAssets(assets) {
    return ensureArray(assets)
        .filter((asset) => asset.from && asset.to)
        .map(({ from, to, keepStructure = false }) => ({
        from: ensureArray(from),
        to: ensureArray(to),
        keepStructure,
    }));
}
const PLUGIN_EXECUTED_FLAG = 'esbuild_copy_executed';
const copy = (options = {}) => {
    const { assets = [], copyOnStart = false, globbyOptions = {}, verbose = false, once = false, keepStructure: globalKeepStructure = false, resolveFrom = 'out', dryRun = false, } = options;
    const formattedAssets = formatAssets(assets);
    const applyHook = copyOnStart ? 'onStart' : 'onEnd';
    return {
        name: 'plugin:copy',
        setup(build) {
            build[applyHook](async () => {
                var _a;
                if (once && process.env[PLUGIN_EXECUTED_FLAG] === 'true') {
                    verboseLog(`Copy plugin skipped as option ${chalk_1.default.white('once')} set to true`, verbose);
                    return;
                }
                if (!formattedAssets.length) {
                    return;
                }
                let outDirResolve;
                if (resolveFrom === 'cwd') {
                    outDirResolve = process.cwd();
                }
                else if (resolveFrom === 'out') {
                    const outDir = (_a = build.initialOptions.outdir) !== null && _a !== void 0 ? _a : path_1.default.dirname(build.initialOptions.outfile);
                    if (!outDir) {
                        verboseLog(chalk_1.default.red(`You should provide valid ${chalk_1.default.white('outdir')} or ${chalk_1.default.white('outfile')} for assets copy. received outdir:${build.initialOptions.outdir}, received outfile:${build.initialOptions.outfile}`), verbose);
                        return;
                    }
                    outDirResolve = outDir;
                }
                else {
                    outDirResolve = resolveFrom;
                }
                verboseLog(`Resolve assert pair to path from: ${path_1.default.resolve(outDirResolve)}`, verbose);
                for (const { from, to, keepStructure: pairKeepStructure, } of formattedAssets) {
                    const pathsCopyFrom = await (0, globby_1.default)(from, {
                        expandDirectories: false,
                        onlyFiles: true,
                        ...globbyOptions,
                    });
                    const keep = globalKeepStructure || pairKeepStructure;
                    verboseLog(`Use ${chalk_1.default.white(keep ? 'Keep-Structure' : 'Merge-Structure')} for current assets pair.`, verbose, true);
                    const deduplicatedPaths = [...new Set(pathsCopyFrom)];
                    if (!deduplicatedPaths.length) {
                        verboseLog(`No files matched using current glob pattern: ${chalk_1.default.white(from)}, maybe you need to configure globby by ${chalk_1.default.white('options.globbyOptions')}?`, verbose);
                    }
                    for (const fromPath of deduplicatedPaths) {
                        to.forEach((toPath) => {
                            keep
                                ? keepStructureCopyHandler(outDirResolve, from, fromPath, toPath, verbose, dryRun)
                                : mergeCopyHandler(outDirResolve, fromPath, toPath, verbose, dryRun);
                        });
                    }
                    process.env[PLUGIN_EXECUTED_FLAG] = 'true';
                }
            });
        },
    };
};
exports.copy = copy;
