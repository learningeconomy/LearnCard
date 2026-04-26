const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
    moduleNameMapper: {
        ...pathsToModuleNameMapper(compilerOptions.paths),
    },
    modulePaths: ['<rootDir>'],
    preset: 'ts-jest',
    reporters: process.env.CI
        ? [['jest-silent-reporter', { useDots: true }], 'summary', 'github-actions']
        : [['jest-silent-reporter', { useDots: true }], 'summary'],
    testEnvironment: 'node',
    transform: {
        '^.+\\.[jt]sx?$': ['esbuild-jest', { sourcemap: true, target: 'es2020' }],
    },
    transformIgnorePatterns: [],
};
