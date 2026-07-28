import { fileURLToPath } from 'url';
import path from 'path';

import { buildPackage } from '../../../scripts/esbuild-package-build.mjs';

await buildPackage({
    packageDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    outfileBase: 'helpers',
    // platform:'node' on CJS emits the `0 && (module.exports = ...)` annotation
    // that cjs-module-lexer needs so Node ESM importers get named exports.
    cjsPlatformNode: true,
});
