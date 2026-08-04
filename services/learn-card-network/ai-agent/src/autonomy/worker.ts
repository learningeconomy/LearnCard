import type { ServiceConfig } from '../config';
import { assertAutonomyDevConfig } from '../config';
import { createAgentServiceRuntime, type AgentServiceRuntime } from '../runtime';
import { createAutonomousScheduler, type AutonomousScheduler } from './scheduler';
import { createMongoAutonomousLeaseRepository, createMongoAutonomousRunRepository } from './runs';

export interface AutonomyWorker {
    runtime: AgentServiceRuntime;
    scheduler: AutonomousScheduler;
    close(): Promise<void>;
}

export const createAutonomyWorker = async (config: ServiceConfig): Promise<AutonomyWorker> => {
    assertAutonomyDevConfig(config);

    const runtime = createAgentServiceRuntime({ config });

    try {
        if (!runtime.providerConfigured) {
            throw new Error('The configured AI provider is not available for the autonomy worker.');
        }

        const mongoStatus = await runtime.mongoRuntime.getStatus();
        if (!mongoStatus.connected) {
            throw new Error(
                mongoStatus.error
                    ? `Autonomy worker MongoDB is unavailable: ${mongoStatus.error}`
                    : 'Autonomy worker MongoDB is unavailable.'
            );
        }

        const db = await runtime.mongoRuntime.getDb();
        const encryption = runtime.getEncryption();
        const probeAad = 'autonomy-worker-startup-probe:v1';
        const probe = await encryption.encryptJson({ available: true }, probeAad);
        await encryption.decryptJson<{ available: boolean }>(probe, probeAad);

        const scheduler = createAutonomousScheduler({
            runtime,
            runRepository: createMongoAutonomousRunRepository(db, encryption),
            leaseRepository: createMongoAutonomousLeaseRepository(db),
            ownerDids: config.autonomyDevDids,
            pollIntervalMs: config.autonomyDevPollIntervalMs,
            maxRunsPerCycle: config.autonomyDevMaxRunsPerCycle,
            leaseMs: config.autonomyDevLeaseMs,
            onCycleComplete: summary => {
                console.log(JSON.stringify(summary));
            },
            onCycleError: error => {
                console.error('AI agent autonomy cycle failed.', error);
            },
        });

        return {
            runtime,
            scheduler,
            close: async () => {
                await scheduler.stop();
                await runtime.mongoRuntime.close();
            },
        };
    } catch (error) {
        await runtime.mongoRuntime.close();
        throw error;
    }
};
