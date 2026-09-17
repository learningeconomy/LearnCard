import 'dotenv/config';

import { getConfig } from '../config';
import { flushObservability, initializeObservability, recordServiceError } from '../observability';
import { createAutonomyWorker } from './worker';

const main = async (): Promise<void> => {
    const config = getConfig();

    initializeObservability(config);

    const worker = await createAutonomyWorker(config);

    try {
        const summary = await worker.scheduler.runOnce('manual');

        console.log(JSON.stringify(summary));
    } finally {
        await worker.close();
        await flushObservability();
    }
};

main().catch(error => {
    recordServiceError('autonomy.once', error);
    process.exitCode = 1;
});
