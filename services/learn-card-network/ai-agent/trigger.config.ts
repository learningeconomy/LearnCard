import { defineConfig } from '@trigger.dev/sdk';
import { syncEnvVars } from '@trigger.dev/build/extensions/core';

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
        conditions: ['development'],
        extensions: [
            syncEnvVars(
                () => {
                    const allowedDids = process.env.AI_AGENT_AUTONOMY_ALLOWED_DIDS?.trim();

                    if (!allowedDids) return;

                    return [
                        {
                            name: 'AI_AGENT_AUTONOMY_DEV_DIDS',
                            value: allowedDids,
                            isSecret: true,
                        },
                    ];
                },
                { override: true }
            ),
        ],
        external: ['@learncard/didkit-plugin-node'],
    },
    dirs: ['./src/trigger'],
});
