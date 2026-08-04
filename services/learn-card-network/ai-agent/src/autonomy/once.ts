import 'dotenv/config';

import { getConfig } from '../config';
import { createAutonomyWorker } from './worker';

const main = async (): Promise<void> => {
    const worker = await createAutonomyWorker(getConfig());

    try {
        const summary = await worker.scheduler.runOnce('manual');

        console.log(JSON.stringify(summary));
    } finally {
        await worker.close();
    }
};

main().catch(error => {
    console.error('AI agent one-shot autonomy worker failed.', error);
    process.exitCode = 1;
});
