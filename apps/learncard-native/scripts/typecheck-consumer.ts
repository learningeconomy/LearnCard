import ts from 'typescript';
import { resolve, relative, isAbsolute } from 'node:path';

// Check our feature against actual workspace source contracts, without requiring
// ignored SDK dist declarations. Existing implementation errors in other packages
// belong to their own checks; never filter a native feature or global/config error.
const root = resolve(import.meta.dir, '..');
const configPath = resolve(root, 'account-runtime/tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    resolve(root, 'account-runtime')
);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const diagnostics = [
    ...(config.error ? [config.error] : []),
    ...parsed.errors,
    ...ts.getPreEmitDiagnostics(program),
];
const native = (path: string) => {
    const value = relative(root, resolve(path));
    return !value.startsWith('..') && !isAbsolute(value);
};
const failures = diagnostics.filter(item => !item.file || native(item.file.fileName));
if (failures.length) {
    console.error(
        ts.formatDiagnosticsWithColorAndContext(failures, {
            getCanonicalFileName: path => path,
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getNewLine: () => '\n',
        })
    );
    process.exit(1);
}
console.log(
    `Native consumer source contracts checked. ${diagnostics.length} dependency diagnostics remain scoped to their owning monorepo packages.`
);
