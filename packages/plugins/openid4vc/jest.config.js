const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
    moduleNameMapper: {
        ...pathsToModuleNameMapper(compilerOptions.paths),
        // `dcql` ships ESM-only (no `main`, only `module: ./dist/index.mjs`).
        // Jest's default resolver doesn't pick up `module`, so we point it
        // straight at the .mjs file, then esbuild-jest transpiles it via
        // the `\.mjs?$` transform pattern below. This is the same shape
        // we'd reach for if we adopted other ESM-only deps in the future.
        '^dcql$': '<rootDir>/../../../node_modules/dcql/dist/index.mjs',
    },
    modulePaths: ['<rootDir>'],
    preset: 'ts-jest',
    reporters: process.env.CI
        ? [['jest-silent-reporter', { useDots: true }], 'summary', 'github-actions']
        : [['jest-silent-reporter', { useDots: true }], 'summary'],
    testEnvironment: 'node',
    transform: {
        // `.mjs` covers ESM-only deps mapped above (e.g. `dcql`); the
        // `[jt]sx?$` line covers our own .ts/.js sources.
        '^.+\\.mjs$': ['esbuild-jest', { sourcemap: true, target: 'es2020' }],
        '^.+\\.[jt]sx?$': ['esbuild-jest', { sourcemap: true, target: 'es2020' }],
    },
    transformIgnorePatterns: [],
};
