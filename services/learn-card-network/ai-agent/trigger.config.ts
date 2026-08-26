import { defineConfig } from '@trigger.dev/sdk';

export default defineConfig({
    project: process.env.AI_AGENT_TRIGGER_PROJECT_REF ?? 'proj_lyfepdqcmztsyzcqmcvx',
    runtime: 'node',
    logLevel: 'log',
    maxDuration: 3600,
    retries: {
        enabledInDev: false,
        default: {
            maxAttempts: 1,
        },
    },
    build: {
        external: ['@learncard/didkit-plugin-node'],
    },
    dirs: ['./src/trigger'],
});
