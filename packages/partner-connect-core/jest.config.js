/* Jest config for @learncard/partner-connect-core */

module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.tsx?$': 'esbuild-jest',
    },
};
