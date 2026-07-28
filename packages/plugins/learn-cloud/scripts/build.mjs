import { fileURLToPath } from 'url';
import path from 'path';

import { buildPackage } from '../../../../scripts/esbuild-package-build.mjs';

await buildPackage({
    packageDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    outfileBase: 'learn-cloud-plugin',
    extraExternals: [
        'isomorphic-fetch',
        'isomorphic-webcrypto',
        // Type-only import (Filter) — not a runtime dependency on the service.
        '@learncard/learn-cloud-service',
        '@learncard/learn-cloud-service/*',
    ],
});
