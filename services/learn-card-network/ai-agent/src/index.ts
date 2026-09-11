import 'dotenv/config';

import { closeAutonomyAccessControl } from './autonomy/accessControl';
import { getConfig } from './config';
import {
    flushObservability,
    initializeObservability,
    recordServiceError,
    verifySentryDelivery,
} from './observability';
import { AGENT_SERVER_SHUTDOWN, createServer } from './server';

const config = getConfig();

initializeObservability(config);
await verifySentryDelivery(config);

const app = createServer({ config });
const server = app.listen(config.port);
const flushRuntime = async (): Promise<void> => {
    await Promise.all([flushObservability(), closeAutonomyAccessControl()]);
};
let shuttingDown = false;

const shutdown = (_signal: NodeJS.Signals): void => {
    if (shuttingDown) return;

    shuttingDown = true;
    const forceCloseTimer = setTimeout(() => {
        recordServiceError('service.shutdown-timeout', new Error('Graceful shutdown timed out.'));
        server.closeAllConnections();
        void flushRuntime().finally(() => process.exit(1));
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
                void flushRuntime().finally(() => {
                    process.exit(shutdownFailed ? 1 : 0);
                });
            });
    });
};

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
process.once('uncaughtException', error => {
    recordServiceError('service.uncaught-exception', error);
    void flushRuntime().finally(() => process.exit(1));
});
process.once('unhandledRejection', error => {
    recordServiceError('service.unhandled-rejection', error);
    void flushRuntime().finally(() => process.exit(1));
});
