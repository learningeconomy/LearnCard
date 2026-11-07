import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
    test: {
        environment: 'node',
        globals: true,
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        ],
    },
});
