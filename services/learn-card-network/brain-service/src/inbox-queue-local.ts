import {
    consumeInboxQueueOnce,
    consumeInboxDeadLettersOnce,
    dispatchInboxJobs,
} from './helpers/inbox-queue.helpers';

let running = true;
process.on('SIGINT', () => {
    running = false;
});
process.on('SIGTERM', () => {
    running = false;
});

/** Run separately from the HTTP process; restarting either process leaves durable jobs intact. */
const run = async (): Promise<void> => {
    while (running) {
        try {
            await dispatchInboxJobs();
            await consumeInboxQueueOnce(10);
            await consumeInboxDeadLettersOnce();
        } catch {
            console.error('Inbox queue iteration failed; durable jobs will be retried.');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};
void run();
