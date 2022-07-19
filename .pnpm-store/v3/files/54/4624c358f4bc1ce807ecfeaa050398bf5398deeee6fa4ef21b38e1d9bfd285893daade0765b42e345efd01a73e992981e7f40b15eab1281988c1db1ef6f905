"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompilerOptions = void 0;
var ts = require("typescript");
var path = require("path");
var get_absolute_path_1 = require("./helpers/get-absolute-path");
var check_diagnostics_errors_1 = require("./helpers/check-diagnostics-errors");
var logger_1 = require("./logger");
var parseConfigHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    readDirectory: ts.sys.readDirectory,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
};
function getCompilerOptions(inputFileNames, preferredConfigPath) {
    var configFileName = preferredConfigPath !== undefined ? preferredConfigPath : findConfig(inputFileNames);
    (0, logger_1.verboseLog)("Using config: ".concat(configFileName));
    var configParseResult = ts.readConfigFile(configFileName, ts.sys.readFile);
    (0, check_diagnostics_errors_1.checkDiagnosticsErrors)(configParseResult.error !== undefined ? [configParseResult.error] : [], 'Error while processing tsconfig file');
    var compilerOptionsParseResult = ts.parseJsonConfigFileContent(configParseResult.config, parseConfigHost, path.resolve(path.dirname(configFileName)), undefined, (0, get_absolute_path_1.getAbsolutePath)(configFileName));
    // we don't want to raise an error if no inputs found in a config file
    // because this error is mostly for CLI, but we'll pass an inputs in createProgram
    var diagnostics = compilerOptionsParseResult.errors
        .filter(function (d) { return d.code !== 18003 /* Constants.NoInputsWereFoundDiagnosticCode */; });
    (0, check_diagnostics_errors_1.checkDiagnosticsErrors)(diagnostics, 'Error while processing tsconfig compiler options');
    return compilerOptionsParseResult.options;
}
exports.getCompilerOptions = getCompilerOptions;
function findConfig(inputFiles) {
    if (inputFiles.length !== 1) {
        throw new Error('Cannot find tsconfig for multiple files. Please specify preferred tsconfig file');
    }
    // input file could be a relative path to the current path
    // and desired config could be outside of current cwd folder
    // so we have to provide absolute path to find config until the root
    var searchPath = (0, get_absolute_path_1.getAbsolutePath)(inputFiles[0]);
    var configFileName = ts.findConfigFile(searchPath, ts.sys.fileExists);
    if (!configFileName) {
        throw new Error("Cannot find config file for file ".concat(searchPath));
    }
    return configFileName;
}
