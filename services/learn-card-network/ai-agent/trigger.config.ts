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
                () => [
                    {
                        name: 'SENTRY_TRACES_SAMPLE_RATE',
                        value: '1',
                    },
                    ...(process.env.GITHUB_SHA
                        ? [
                              {
                                  name: 'SENTRY_RELEASE',
                                  value: `sha-${process.env.GITHUB_SHA}`,
                              },
                          ]
                        : []),
                ],
                { override: true }
            ),
        ],
        external: ['@learncard/didkit-plugin-node'],
    },
    dirs: ['./src/trigger'],
});
