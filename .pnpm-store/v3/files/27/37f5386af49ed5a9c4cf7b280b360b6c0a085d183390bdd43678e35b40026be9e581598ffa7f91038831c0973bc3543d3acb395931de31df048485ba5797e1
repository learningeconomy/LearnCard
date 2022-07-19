#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var ts = require("typescript");
var yargs = require("yargs");
var load_config_file_1 = require("../config-file/load-config-file");
var bundle_generator_1 = require("../bundle-generator");
var check_diagnostics_errors_1 = require("../helpers/check-diagnostics-errors");
var get_compiler_options_1 = require("../get-compiler-options");
var fix_path_1 = require("../helpers/fix-path");
var measure_time_1 = require("../helpers/measure-time");
var logger_1 = require("../logger");
function toStringsArray(data) {
    if (data === undefined) {
        return data;
    }
    if (!Array.isArray(data)) {
        throw new Error("".concat(data, " is not a array"));
    }
    return data.map(String);
}
/* eslint-enable @typescript-eslint/naming-convention */
function parseArgs() {
    return yargs
        .parserConfiguration({
        /* eslint-disable @typescript-eslint/naming-convention */
        'boolean-negation': false,
        'camel-case-expansion': false,
        'dot-notation': false,
        'short-option-groups': false,
        /* eslint-enable @typescript-eslint/naming-convention */
    })
        .usage('Usage: $0 [options] <file(s)>')
        .demandCommand(0)
        .option('out-file', {
        alias: 'o',
        type: 'string',
        description: 'File name of generated d.ts',
    })
        .option('verbose', {
        type: 'boolean',
        default: false,
        description: 'Enable verbose logging',
    })
        .option('silent', {
        type: 'boolean',
        default: false,
        description: 'Disable any logging except errors',
    })
        .option('no-check', {
        type: 'boolean',
        default: false,
        description: 'Skip validation of generated d.ts file',
    })
        .option('fail-on-class', {
        type: 'boolean',
        default: false,
        description: 'Fail if generated dts contains class declaration',
    })
        .option('external-inlines', {
        type: 'array',
        description: 'Array of package names from node_modules to inline typings from.\n' +
            'Used types will be inlined into the output file',
        coerce: toStringsArray,
    })
        .option('external-imports', {
        type: 'array',
        description: 'Array of package names from node_modules to import typings from.\n' +
            'Used types will be imported using "import { First, Second } from \'library-name\';".\n' +
            'By default all libraries will be imported (except inlined libraries and libraries from @types)',
        coerce: toStringsArray,
    })
        .option('external-types', {
        type: 'array',
        description: 'Array of package names from @types to import typings from via the triple-slash reference directive.\n' +
            'By default all packages are allowed and will be used according to their usages',
        coerce: toStringsArray,
    })
        .option('umd-module-name', {
        type: 'string',
        description: 'Name of the UMD module. If specified then `export as namespace ModuleName;` will be emitted',
    })
        .option('project', {
        type: 'string',
        description: 'Path to the tsconfig.json file that will be used for the compilation',
    })
        .option('sort', {
        type: 'boolean',
        default: false,
        description: 'Sort output nodes',
    })
        .option('inline-declare-global', {
        type: 'boolean',
        default: false,
        description: 'Enables inlining of `declare global` statements contained in files which should be inlined (all local files and packages from `--external-inlines`)',
    })
        .option('inline-declare-externals', {
        type: 'boolean',
        default: false,
        description: 'Enables inlining of `declare module` statements of the global modules (e.g. `declare module \'external-module\' {}`, but NOT `declare module \'./internal-module\' {}`) contained in files which should be inlined (all local files and packages from inlined libraries)',
    })
        .option('disable-symlinks-following', {
        type: 'boolean',
        default: false,
        description: '(EXPERIMENTAL) Disables resolving of symlinks to the original path. See https://github.com/timocov/dts-bundle-generator/issues/39 for more information',
    })
        .option('respect-preserve-const-enum', {
        type: 'boolean',
        default: false,
        description: 'Enables stripping the `const` keyword from every direct-exported (or re-exported) from entry file `const enum`. See https://github.com/timocov/dts-bundle-generator/issues/110 for more information',
    })
        .option('export-referenced-types', {
        type: 'boolean',
        default: true,
        description: 'By default all interfaces, types and const enums are marked as exported even if they aren\'t exported directly. This option allows you to disable this behavior so a node will be exported if it is exported from root source file only.',
    })
        .option('config', {
        type: 'string',
        description: 'File path to the generator config file',
    })
        .option('no-banner', {
        type: 'boolean',
        default: false,
        description: 'Allows remove "Generated by dts-bundle-generator" comment from the output',
    })
        .version()
        .strict()
        .example('$0 path/to/your/entry-file.ts', '')
        .example('$0 path/to/your/entry-file.ts path/to/your/entry-file-2.ts', '')
        .example('$0 --external-types jquery react -- entry-file.ts', '')
        .wrap(Math.min(100, yargs.terminalWidth()))
        .argv;
}
function generateOutFileName(inputFilePath) {
    var inputFileName = path.parse(inputFilePath).name;
    return (0, fix_path_1.fixPath)(path.join(inputFilePath, '..', inputFileName + '.d.ts'));
}
// eslint-disable-next-line complexity
function main() {
    var args = parseArgs();
    if (args.silent && args.verbose) {
        throw new Error('Cannot use both silent and verbose options at the same time');
    }
    else if (args.verbose) {
        (0, logger_1.enableVerbose)();
    }
    else if (!args.silent) {
        (0, logger_1.enableNormalLog)();
    }
    var bundlerConfig;
    if (args.config !== undefined) {
        (0, logger_1.verboseLog)("Trying to load config from ".concat(args.config, " file..."));
        bundlerConfig = (0, load_config_file_1.loadConfigFile)(args.config);
    }
    else {
        if (args._.length < 1) {
            throw new Error('No input files specified');
        }
        if (args._.length > 1 && args['out-file']) {
            throw new Error('Cannot use outFile with multiple entries');
        }
        bundlerConfig = {
            entries: args._.map(function (entryPath) {
                return {
                    filePath: String(entryPath),
                    outFile: args['out-file'],
                    noCheck: args['no-check'],
                    libraries: {
                        allowedTypesLibraries: args['external-types'],
                        importedLibraries: args['external-imports'],
                        inlinedLibraries: args['external-inlines'],
                    },
                    output: {
                        inlineDeclareExternals: args['inline-declare-externals'],
                        inlineDeclareGlobals: args['inline-declare-global'],
                        umdModuleName: args['umd-module-name'],
                        sortNodes: args.sort,
                        noBanner: args['no-banner'],
                        respectPreserveConstEnum: args['respect-preserve-const-enum'],
                        exportReferencedTypes: args['export-referenced-types'],
                    },
                    failOnClass: args['fail-on-class'],
                };
            }),
            compilationOptions: {
                preferredConfigPath: args.project,
                followSymlinks: !args['disable-symlinks-following'],
            },
        };
    }
    (0, logger_1.verboseLog)("Total entries count=".concat(bundlerConfig.entries.length));
    var generatedDts = (0, bundle_generator_1.generateDtsBundle)(bundlerConfig.entries, bundlerConfig.compilationOptions);
    var outFilesToCheck = [];
    for (var i = 0; i < bundlerConfig.entries.length; ++i) {
        var entry = bundlerConfig.entries[i];
        var outFile = entry.outFile !== undefined ? entry.outFile : generateOutFileName(entry.filePath);
        (0, logger_1.normalLog)("Writing ".concat(entry.filePath, " -> ").concat(outFile));
        ts.sys.writeFile(outFile, generatedDts[i]);
        if (!entry.noCheck) {
            outFilesToCheck.push(outFile);
        }
    }
    if (outFilesToCheck.length === 0) {
        (0, logger_1.normalLog)('File checking is skipped (due nothing to check)');
        return;
    }
    (0, logger_1.normalLog)('Checking generated files...');
    var preferredConfigFile = bundlerConfig.compilationOptions !== undefined ? bundlerConfig.compilationOptions.preferredConfigPath : undefined;
    var compilerOptions = (0, get_compiler_options_1.getCompilerOptions)(outFilesToCheck, preferredConfigFile);
    if (compilerOptions.skipLibCheck) {
        compilerOptions.skipLibCheck = false;
        (0, logger_1.warnLog)('Compiler option "skipLibCheck" is disabled to properly check generated output');
    }
    var program = ts.createProgram(outFilesToCheck, compilerOptions);
    (0, check_diagnostics_errors_1.checkProgramDiagnosticsErrors)(program);
}
try {
    var executionTime = (0, measure_time_1.measureTime)(main);
    (0, logger_1.normalLog)("Done in ".concat((executionTime / 1000).toFixed(2), "s"));
}
catch (ex) {
    (0, logger_1.normalLog)('');
    (0, logger_1.errorLog)("Error: ".concat(ex.message));
    process.exit(1);
}
