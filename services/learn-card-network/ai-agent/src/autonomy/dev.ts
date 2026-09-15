import 'dotenv/config';

import { getConfig } from '../config';
import { flushObservability, initializeObservability, recordServiceError } from '../observability';
import { createAutonomyWorker } from './worker';

const main = async (): Promise<void> => {
    const config = getConfig();

    initializeObservability(config);

    const worker = await createAutonomyWorker(config);
    let shutdownPromise: Promise<void> | undefined;

    const shutdown = (signal: NodeJS.Signals): Promise<void> => {
        if (shutdownPromise) return shutdownPromise;

        console.log(`AI agent autonomy worker received ${signal}; draining active work.`);
        shutdownPromise = worker.close().then(flushObservability);

        return shutdownPromise;
    };
    process.once('SIGINT', () => void shutdown('SIGINT'));
    process.once('SIGTERM', () => void shutdown('SIGTERM'));

    console.log(
        `AI agent autonomy worker enabled for ${worker.runtime.config.autonomyDevDids.length} development fixture DID(s).`
    );
    await worker.scheduler.start();
    console.log('AI agent autonomy worker startup cycle completed.');
};

main().catch(error => {
    recordServiceError('autonomy.worker', error);
    process.exitCode = 1;
});
