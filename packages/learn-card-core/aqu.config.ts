import { type BuildOptions } from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

const buildOptions: BuildOptions = {
    // target: 'es6',
    target: 'es2020',
    plugins: [
        copy({ assets: [{ keepStructure: true, from: ['./src/didkit/pkg/*'], to: ['./didkit'] }] }),
    ],
    sourcemap: true,
    external: [
        'fs',
        'path',
        'crypto',
        'process',
        'abortcontroller-polyfill',
        'abort-controller',
        'isomorphic-webcrypto',
        'cross-fetch',
        'ethers',
    ],
};

const options = { buildOptions };

export default options;
