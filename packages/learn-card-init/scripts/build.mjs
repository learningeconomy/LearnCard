import { fileURLToPath } from 'url';
import path from 'path';

import { copy } from 'esbuild-plugin-copy';

import { buildPackage } from '../../../scripts/esbuild-package-build.mjs';

await buildPackage({
    packageDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    outfileBase: 'init',
    extraExternals: [
        'fs',
        'path',
        'crypto',
        'process',
        'abortcontroller-polyfill',
        'abort-controller',
        'isomorphic-fetch',
        'isomorphic-webcrypto',
        'cross-fetch',
        'ethers',
        'cipher-base',
    ],
    esmPlugins: [
        copy({
            assets: [{ keepStructure: true, from: ['./src/didkit/pkg/*'], to: ['./didkit'] }],
        }),
    ],
});
