import { Redis } from 'ioredis';
import { hostname } from 'node:os';
import { z } from 'zod';
import { loadConfig } from './config';
import { createBrainClient } from './brain-client';
import { ComposeDriver, runDocker } from './compose-driver';
import { createHealthProbe } from './health';
import { Jobs } from './jobs';
import { AgentError, Redactor } from './redact';

export const main = async (): Promise<void> => {
    const log = new Redactor();
    try {
        const config = loadConfig();
        log.add(config.WORKLOAD_AGENT_TOKEN);
        const executorId = (
            await runDocker(
                ['inspect', '--format', '{{.Id}}', config.WORKLOAD_AGENT_CONTAINER],
                5000
            )
        ).trim();
        if (!executorId.startsWith(hostname())) throw new AgentError('SINGLE_EXECUTOR_REQUIRED');
        const networks = z
            .record(z.string(), z.unknown())
            .parse(
                JSON.parse(
                    await runDocker(
                        [
                            'inspect',
                            '--format',
                            '{{json .NetworkSettings.Networks}}',
                            config.WORKLOAD_AGENT_CONTAINER,
                        ],
                        5000
                    )
                )
            );
        for (const network of Object.keys(networks))
            if (/^lcnwl-[a-z0-9-]+-private$/.test(network)) {
                await runDocker(
                    ['network', 'disconnect', network, config.WORKLOAD_AGENT_CONTAINER],
                    5000
                );
            }
        const jobs = new Jobs(
            createBrainClient(config),
            new ComposeDriver(config, log),
            createHealthProbe(runDocker, config.WORKLOAD_AGENT_CONTAINER),
            log
        );
        await jobs.recover();
        let stopped = false;
        let wake: (() => void) | undefined;
        const stop = (): void => {
            stopped = true;
            wake?.();
        };
        process.once('SIGINT', stop);
        process.once('SIGTERM', stop);
        const redis = config.WORKLOAD_REDIS_URL
            ? new Redis(config.WORKLOAD_REDIS_URL, {
                  lazyConnect: true,
                  maxRetriesPerRequest: 1,
                  connectTimeout: 2000,
              })
            : undefined;
        redis?.on('error', (): void => log.log('REDIS_UNAVAILABLE_POLLING'));
        redis?.on('ready', (): void => {
            void redis
                .subscribe('workload-operations')
                .catch((): void => log.log('REDIS_UNAVAILABLE_POLLING'));
        });
        redis?.on('message', (): void => wake?.());
        void redis?.connect().catch((): void => log.log('REDIS_UNAVAILABLE_POLLING'));
        while (!stopped) {
            try {
                await jobs.poll();
                await jobs.health();
            } catch (error) {
                log.error(error);
            }
            if (!stopped)
                await new Promise<void>((resolve): void => {
                    const timer = setTimeout(resolve, config.WORKLOAD_AGENT_POLL_MS);
                    wake = (): void => {
                        clearTimeout(timer);
                        resolve();
                    };
                });
        }
        redis?.disconnect();
    } catch (error) {
        log.error(error);
        process.exitCode = 1;
    }
};
void main();
