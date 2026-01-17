export default {
    displayName: 'learn-card-app',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.[jt]sx?$': ['esbuild-jest', { sourcemap: true, target: 'es2020', jsx: 'automatic' }],
    },
    // Transform ESM modules in node_modules (pnpm uses .pnpm folder structure)
    transformIgnorePatterns: [
        '/node_modules/.pnpm/(?!(' +
            '@ionic\\+|' +
            '@capacitor\\+|' +
            '@capacitor-firebase\\+|' +
            '@stencil\\+|' +
            'ionicons\\+|' +
            'swiper\\+|' +
            'ssr-window\\+|' +
            'dom7\\+|' +
            'tslib\\+|' +
            '@tanstack\\+|' +
            'query-string\\+|' +
            'decode-uri-component\\+|' +
            'split-on-first\\+|' +
            'filter-obj\\+|' +
            '@sentry\\+|' +
            'history\\+' +
        '))',
    ],
    moduleNameMapper: {
        // Path aliases from tsconfig
        '^learn-card-base$': '<rootDir>/../../packages/learn-card-base/src/index.ts',
        '^learn-card-base/(.*)$': '<rootDir>/../../packages/learn-card-base/src/$1',
        // Asset mocks
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.ts',
        '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.ts',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
};
