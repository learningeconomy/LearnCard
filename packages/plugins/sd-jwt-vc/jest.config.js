const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
    moduleNameMapper: {
        ...pathsToModuleNameMapper(compilerOptions.paths),
        // The `@sd-jwt/*` packages ship ESM-only (`module: ./dist/index.mjs`,
        // no `main`). Jest's default resolver doesn't pick `module`, so we
        // point it at the .mjs files directly. The `\.mjs?$` transform
        // below converts them via esbuild-jest. Same shape as the openid4vc
        // plugin uses for `dcql`.
        '^@sd-jwt/core$': '<rootDir>/../../../node_modules/@sd-jwt/core/dist/index.mjs',
        '^@sd-jwt/decode$': '<rootDir>/../../../node_modules/@sd-jwt/decode/dist/index.mjs',
        '^@sd-jwt/sd-jwt-vc$': '<rootDir>/../../../node_modules/@sd-jwt/sd-jwt-vc/dist/index.mjs',
    },
    modulePaths: ['<rootDir>'],
    preset: 'ts-jest',
    reporters: process.env.CI
        ? [['jest-silent-reporter', { useDots: true }], 'summary', 'github-actions']
        : [['jest-silent-reporter', { useDots: true }], 'summary'],
    testEnvironment: 'node',
    transform: {
        '^.+\\.mjs$': [
            'esbuild-jest',
            { sourcemap: true, target: 'es2020', loaders: { '.mjs': 'js' } },
        ],
        '^.+\\.[jt]sx?$': ['esbuild-jest', { sourcemap: true, target: 'es2020' }],
    },
    transformIgnorePatterns: [],
};
