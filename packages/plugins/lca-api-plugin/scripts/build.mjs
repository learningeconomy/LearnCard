import { fileURLToPath } from 'url';
import path from 'path';

import { buildPackage } from '../../../../scripts/esbuild-package-build.mjs';

await buildPackage({
    packageDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    outfileBase: 'lca-api-plugin',
});
