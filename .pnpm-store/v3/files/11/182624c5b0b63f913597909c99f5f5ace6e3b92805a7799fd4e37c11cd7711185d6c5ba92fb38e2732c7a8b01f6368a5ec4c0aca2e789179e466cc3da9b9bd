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
exports.pack = exports.filterFilesForZipPackage = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const globby_1 = __importDefault(require("globby"));
const path_1 = __importDefault(require("path"));
const ramda_1 = require("ramda");
const semver_1 = __importDefault(require("semver"));
const constants_1 = require("./constants");
const helper_1 = require("./helper");
const Packagers = __importStar(require("./packagers"));
const utils_1 = require("./utils");
function setFunctionArtifactPath(func, artifactPath) {
    const version = this.serverless.getVersion();
    // Serverless changed the artifact path location in version 1.18
    if (semver_1.default.lt(version, '1.18.0')) {
        func.artifact = artifactPath;
        func.package = Object.assign({}, func.package, { disable: true });
        this.log.verbose(`${func.name} is packaged by the esbuild plugin. Ignore messages from SLS.`);
    }
    else {
        func.package = {
            artifact: artifactPath,
        };
    }
}
const excludedFilesDefault = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'package.json'];
const filterFilesForZipPackage = ({ files, functionAlias, includedFiles, excludedFiles, hasExternals, isGoogleProvider, depWhiteList, }) => {
    return files.filter(({ localPath }) => {
        // if file is present in patterns it must be included
        if (includedFiles.find((file) => file === localPath)) {
            return true;
        }
        // exclude non individual files based on file path (and things that look derived, e.g. foo.js => foo.js.map)
        if (excludedFiles.find((p) => localPath.startsWith(`${p}.`)))
            return false;
        // exclude files that belong to individual functions
        if (localPath.startsWith(constants_1.ONLY_PREFIX) &&
            !localPath.startsWith(`${constants_1.ONLY_PREFIX}${functionAlias}/`))
            return false;
        // exclude non whitelisted dependencies
        if (localPath.startsWith('node_modules')) {
            // if no externals is set or if the provider is google, we do not need any files from node_modules
            if (!hasExternals || isGoogleProvider)
                return false;
            if (
            // this is needed for dependencies that maps to a path (like scoped ones)
            !depWhiteList.find((dep) => (0, helper_1.doSharePath)(localPath, 'node_modules/' + dep)))
                return false;
        }
        return true;
    });
};
exports.filterFilesForZipPackage = filterFilesForZipPackage;
async function pack() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    // GOOGLE Provider requires a package.json and NO node_modules
    const isGoogleProvider = ((_c = (_b = (_a = this.serverless) === null || _a === void 0 ? void 0 : _a.service) === null || _b === void 0 ? void 0 : _b.provider) === null || _c === void 0 ? void 0 : _c.name) === 'google';
    const excludedFiles = isGoogleProvider ? [] : excludedFilesDefault;
    // Google provider cannot use individual packaging for now - this could be built in a future release
    if (isGoogleProvider && ((_f = (_e = (_d = this.serverless) === null || _d === void 0 ? void 0 : _d.service) === null || _e === void 0 ? void 0 : _e.package) === null || _f === void 0 ? void 0 : _f.individually))
        throw new Error('Packaging failed: cannot package function individually when using Google provider');
    // get a list of all path in build
    const files = globby_1.default
        .sync('**', {
        cwd: this.buildDirPath,
        dot: true,
        onlyFiles: true,
    })
        .filter((p) => !excludedFiles.includes(p))
        .map((localPath) => ({ localPath, rootPath: path_1.default.join(this.buildDirPath, localPath) }));
    if ((0, ramda_1.isEmpty)(files)) {
        console.log('Packaging: No files found. Skipping esbuild.');
        return;
    }
    // 1) If individually is not set, just zip the all build dir and return
    if (!((_j = (_h = (_g = this.serverless) === null || _g === void 0 ? void 0 : _g.service) === null || _h === void 0 ? void 0 : _h.package) === null || _j === void 0 ? void 0 : _j.individually)) {
        const zipName = `${this.serverless.service.service}.zip`;
        const artifactPath = path_1.default.join(this.workDirPath, constants_1.SERVERLESS_FOLDER, zipName);
        // remove prefixes from individual extra files
        const filesPathList = (0, ramda_1.pipe)((0, ramda_1.reject)((0, ramda_1.test)(/^__only_[^/]+$/)), (0, ramda_1.map)((0, ramda_1.over)((0, ramda_1.lensProp)('localPath'), (0, ramda_1.replace)(/^__only_[^/]+\//, ''))))(files);
        const startZip = Date.now();
        await (0, utils_1.zip)(artifactPath, filesPathList, this.buildOptions.nativeZip);
        const { size } = fs_extra_1.default.statSync(artifactPath);
        this.log.verbose(`Zip service ${this.serverless.service.service} - ${(0, utils_1.humanSize)(size)} [${Date.now() - startZip} ms]`);
        // defined present zip as output artifact
        this.serverless.service.package.artifact = artifactPath;
        return;
    }
    // 2) If individually is set, we'll optimize files and zip per-function
    const packager = await Packagers.get(this.buildOptions.packager);
    // get a list of every function bundle
    const buildResults = this.buildResults;
    const bundlePathList = buildResults.map((b) => b.bundlePath);
    let externals = [];
    // get the list of externals to include only if exclude is not set to *
    if (this.buildOptions.exclude !== '*' && !this.buildOptions.exclude.includes('*')) {
        externals = (0, ramda_1.without)(this.buildOptions.exclude, this.buildOptions.external);
    }
    const hasExternals = !!(externals === null || externals === void 0 ? void 0 : externals.length);
    // get a tree of all production dependencies
    const packagerDependenciesList = hasExternals
        ? await packager.getProdDependencies(this.buildDirPath)
        : {};
    const packageFiles = await (0, globby_1.default)(this.serverless.service.package.patterns);
    // package each function
    await Promise.all(buildResults.map(async ({ func, functionAlias, bundlePath }) => {
        const excludedFiles = bundlePathList
            .filter((p) => !bundlePath.startsWith(p))
            .map(utils_1.trimExtension);
        const functionFiles = await (0, globby_1.default)(func.package.patterns);
        const includedFiles = [...packageFiles, ...functionFiles];
        // allowed external dependencies in the final zip
        let depWhiteList = [];
        if (hasExternals) {
            const bundleDeps = (0, helper_1.getDepsFromBundle)(path_1.default.join(this.buildDirPath, bundlePath), this.buildOptions.platform);
            const bundleExternals = (0, ramda_1.intersection)(bundleDeps, externals);
            depWhiteList = (0, helper_1.flatDep)(packagerDependenciesList.dependencies, bundleExternals);
        }
        const zipName = `${functionAlias}.zip`;
        const artifactPath = path_1.default.join(this.workDirPath, constants_1.SERVERLESS_FOLDER, zipName);
        // filter files
        const filesPathList = (0, exports.filterFilesForZipPackage)({
            files,
            functionAlias,
            includedFiles,
            excludedFiles,
            hasExternals,
            isGoogleProvider,
            depWhiteList,
        })
            // remove prefix from individual function extra files
            .map(({ localPath, ...rest }) => ({
            localPath: localPath.replace(`${constants_1.ONLY_PREFIX}${functionAlias}/`, ''),
            ...rest,
        }));
        const startZip = Date.now();
        await (0, utils_1.zip)(artifactPath, filesPathList, this.buildOptions.nativeZip);
        const { size } = fs_extra_1.default.statSync(artifactPath);
        this.log.verbose(`Zip function: ${functionAlias} - ${(0, utils_1.humanSize)(size)} [${Date.now() - startZip} ms]`);
        // defined present zip as output artifact
        setFunctionArtifactPath.call(this, func, path_1.default.relative(this.serviceDirPath, artifactPath));
    }));
}
exports.pack = pack;
