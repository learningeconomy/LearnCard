/* Jest config for @learncard/partner-connect */

module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.tsx?$': 'esbuild-jest',
    },
};
