"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileDts = void 0;
var path = require("path");
var ts = require("typescript");
var logger_1 = require("./logger");
var get_compiler_options_1 = require("./get-compiler-options");
var get_absolute_path_1 = require("./helpers/get-absolute-path");
var check_diagnostics_errors_1 = require("./helpers/check-diagnostics-errors");
function compileDts(rootFiles, preferredConfigPath, followSymlinks) {
    if (followSymlinks === void 0) { followSymlinks = true; }
    var compilerOptions = (0, get_compiler_options_1.getCompilerOptions)(rootFiles, preferredConfigPath);
    // currently we don't support these compiler options
    // and removing them shouldn't affect generated code
    // so let's just remove them for this run
    compilerOptions.outDir = undefined;
    compilerOptions.incremental = undefined;
    compilerOptions.tsBuildInfoFile = undefined;
    compilerOptions.declarationDir = undefined;
    if (compilerOptions.composite) {
        (0, logger_1.warnLog)("Composite projects aren't supported at the time. Prefer to use non-composite project to generate declarations instead or just ignore this message if everything works fine. See https://github.com/timocov/dts-bundle-generator/issues/93");
        compilerOptions.composite = undefined;
    }
    var dtsFiles = getDeclarationFiles(rootFiles, compilerOptions);
    (0, logger_1.verboseLog)("dts cache:\n  ".concat(Object.keys(dtsFiles).join('\n  '), "\n"));
    var host = ts.createCompilerHost(compilerOptions);
    if (!followSymlinks) {
        host.realpath = function (p) { return p; };
    }
    host.resolveModuleNames = function (moduleNames, containingFile) {
        return moduleNames.map(function (moduleName) {
            var resolvedModule = ts.resolveModuleName(moduleName, containingFile, compilerOptions, host).resolvedModule;
            if (resolvedModule && !resolvedModule.isExternalLibraryImport && resolvedModule.extension !== ts.Extension.Dts) {
                resolvedModule.extension = ts.Extension.Dts;
                (0, logger_1.verboseLog)("Change module from .ts to .d.ts: ".concat(resolvedModule.resolvedFileName));
                resolvedModule.resolvedFileName = changeExtensionToDts(resolvedModule.resolvedFileName);
            }
            return resolvedModule;
        });
    };
    var originalGetSourceFile = host.getSourceFile;
    host.getSourceFile = function (fileName, languageVersion, onError) {
        var absolutePath = (0, get_absolute_path_1.getAbsolutePath)(fileName);
        var storedValue = dtsFiles.get(absolutePath);
        if (storedValue !== undefined) {
            (0, logger_1.verboseLog)("dts cache match: ".concat(absolutePath));
            return ts.createSourceFile(fileName, storedValue, languageVersion);
        }
        (0, logger_1.verboseLog)("dts cache mismatch: ".concat(absolutePath, " (").concat(fileName, ")"));
        return originalGetSourceFile(fileName, languageVersion, onError);
    };
    var rootFilesRemapping = new Map();
    var inputFiles = rootFiles.map(function (rootFile) {
        var rootDtsFile = changeExtensionToDts(rootFile);
        rootFilesRemapping.set(rootFile, rootDtsFile);
        return rootDtsFile;
    });
    var program = ts.createProgram(inputFiles, compilerOptions, host);
    (0, check_diagnostics_errors_1.checkProgramDiagnosticsErrors)(program);
    warnAboutTypeScriptFilesInProgram(program);
    return { program: program, rootFilesRemapping: rootFilesRemapping };
}
exports.compileDts = compileDts;
function changeExtensionToDts(fileName) {
    if (fileName.slice(-5) === '.d.ts') {
        return fileName;
    }
    // .ts, .tsx
    var ext = path.extname(fileName);
    return fileName.slice(0, -ext.length) + '.d.ts';
}
/**
 * @description Compiles source files into d.ts files and returns map of absolute path to file content
 */
function getDeclarationFiles(rootFiles, compilerOptions) {
    // we must pass `declaration: true` and `noEmit: false` if we want to generate declaration files
    // see https://github.com/microsoft/TypeScript/issues/24002#issuecomment-550549393
    compilerOptions = __assign(__assign({}, compilerOptions), { noEmit: false, declaration: true });
    var program = ts.createProgram(rootFiles, compilerOptions);
    var allFilesAreDeclarations = program.getSourceFiles().every(function (s) { return s.isDeclarationFile; });
    var declarations = new Map();
    if (allFilesAreDeclarations) {
        // if all files are declarations we don't need to compile the project twice
        // so let's just return empty map to speed up
        (0, logger_1.verboseLog)('Skipping compiling the project to generate d.ts because all files in it are d.ts already');
        return declarations;
    }
    (0, check_diagnostics_errors_1.checkProgramDiagnosticsErrors)(program);
    var emitResult = program.emit(undefined, function (fileName, data) { return declarations.set((0, get_absolute_path_1.getAbsolutePath)(fileName), data); }, undefined, true);
    (0, check_diagnostics_errors_1.checkDiagnosticsErrors)(emitResult.diagnostics, 'Errors while emitting declarations');
    return declarations;
}
function warnAboutTypeScriptFilesInProgram(program) {
    var nonDeclarationFiles = program.getSourceFiles().filter(function (file) { return !file.isDeclarationFile; });
    if (nonDeclarationFiles.length !== 0) {
        (0, logger_1.warnLog)("WARNING: It seems that some files in the compilation still are not declaration files.\nFor more information see https://github.com/timocov/dts-bundle-generator/issues/53.\nIf you think this is a mistake, feel free to open new issue or just ignore this warning.\n  ".concat(nonDeclarationFiles.map(function (file) { return file.fileName; }).join('\n  '), "\n"));
    }
}
