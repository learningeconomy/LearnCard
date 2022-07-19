#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const __1 = require("..");
const { version } = require('../../package.json');
commander_1.program
    .name('tsc-alias')
    .version(version)
    .option('-p, --project <file>', 'path to tsconfig.json')
    .option('-w, --watch', 'Observe file changes')
    .option('--dir, --directory <dir>', 'Run in a folder leaving the "outDir" of the tsconfig.json (relative path to tsconfig)')
    .option('-f, --resolve-full-paths', 'Attempt to fully resolve import paths if the corresponding .js file can be found')
    .option('-s, --silent', 'Reduced terminal output (default: true) [deprecated]')
    .option('-v, --verbose', 'Additional information is output to the terminal')
    .option('-r, --replacer <replacers...>', 'path to optional extra replacer')
    .parseAsync(process.argv);
const options = commander_1.program.opts();
(0, __1.replaceTscAliasPaths)({
    configFile: options.project,
    watch: !!options.watch,
    outDir: options.directory,
    verbose: !!options.verbose,
    resolveFullPaths: !!options.resolveFullPaths,
    replacers: options.replacer
});
//# sourceMappingURL=index.js.map