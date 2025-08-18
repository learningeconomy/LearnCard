/* Jest config for @learncard/embed-sdk */

module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'esbuild-jest',
  },
  moduleNameMapper: {
    '^preact/dist/preact\\.min\\.umd\\.js$': '<rootDir>/__mocks__/stringMock.js',
    '^\\./iframe/island\\.js$': '<rootDir>/__mocks__/stringMock.js',
  },
};
