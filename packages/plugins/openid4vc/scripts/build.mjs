import { fileURLToPath } from 'url';
import path from 'path';

import { buildPackage } from '../../../../scripts/esbuild-package-build.mjs';

await buildPackage({
    packageDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    outfileBase: 'openid4vc-plugin',
    extraExternals: [
        'isomorphic-fetch',
        'isomorphic-webcrypto',
        // Type-only usage — declared in devDependencies, not runtime deps.
        '@learncard/types',
        '@learncard/types/*',
    ],
});
