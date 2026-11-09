import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['web/**/*.test.ts', 'browser-verifier/**/*.test.ts'], environment: 'node' } });
