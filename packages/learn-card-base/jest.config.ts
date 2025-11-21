import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from '../../tsconfig.json';

/* eslint-disable */
export default {
    displayName: 'learn-card-base',

    moduleNameMapper: {
        '\\@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm\\?url':
            '<rootDir>/mocks/didkit.ts',
        '\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/mocks/fileMock.ts',
        '\\.(css|less)$': '<rootDir>/mocks/fileMock.ts',
        'swiper/css/navigation': '<rootDir>/mocks/fileMock.ts',
        ...pathsToModuleNameMapper(compilerOptions.paths),
    },
    modulePaths: ['<rootDir>', '<rootDir>/../../'],
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.[jt]sx?$': ['esbuild-jest', { sourcemap: true, target: 'es2020' }],
    },
    transformIgnorePatterns: [],
    setupFiles: ['./jest-setup.ts'],

    reporters: process.env.CI
        ? [['jest-silent-reporter', { useDots: true }], 'summary', 'github-actions']
        : ['default'],

    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    coverageDirectory: '../../coverage/packages/learn-card-base',
};
