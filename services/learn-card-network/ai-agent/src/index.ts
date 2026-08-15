import 'dotenv/config';

import { getConfig } from './config';
import { flushObservability, initializeObservability, recordServiceError } from './observability';
import { AGENT_SERVER_SHUTDOWN, createServer } from './server';

const config = getConfig();

initializeObservability(config);

const app = createServer({ config });
const server = app.listen(config.port);
let shuttingDown = false;

const shutdown = (_signal: NodeJS.Signals): void => {
    if (shuttingDown) return;

    shuttingDown = true;
    const forceCloseTimer = setTimeout(() => {
        recordServiceError('service.shutdown-timeout', new Error('Graceful shutdown timed out.'));
        server.closeAllConnections();
        void flushObservability().finally(() => process.exit(1));
    }, 15_000);

    forceCloseTimer.unref();
    server.close(error => {
        let shutdownFailed = Boolean(error);

        if (error) recordServiceError('service.shutdown', error);
        void app[AGENT_SERVER_SHUTDOWN]()
            .catch(shutdownError => {
                shutdownFailed = true;
                recordServiceError('service.shutdown', shutdownError);
            })
            .finally(() => {
                clearTimeout(forceCloseTimer);
                void flushObservability().finally(() => {
                    process.exit(shutdownFailed ? 1 : 0);
                });
            });
    });
};

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
process.once('uncaughtException', error => {
    recordServiceError('service.uncaught-exception', error);
    void flushObservability().finally(() => process.exit(1));
});
process.once('unhandledRejection', error => {
    recordServiceError('service.unhandled-rejection', error);
    void flushObservability().finally(() => process.exit(1));
});
