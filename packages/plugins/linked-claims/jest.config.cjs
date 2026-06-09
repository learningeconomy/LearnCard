module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/test/**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2020',
          module: 'CommonJS',
          moduleResolution: 'node',
          esModuleInterop: true,
          isolatedModules: true,
          skipLibCheck: true,
          allowSyntheticDefaultImports: true,
        },
        diagnostics: false
      }
    ]
  },
  transformIgnorePatterns: ['/node_modules/'],
};
