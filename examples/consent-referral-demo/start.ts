import { createConnection } from 'node:net';
import { createDemoCompose, runCompose, waitForServices } from './services';
import { startDemo } from './server';

let servicesRunning = false;
let databaseNetwork: string | undefined;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--services-running') servicesRunning = true;
    else if (args[i] === '--db-network' && args[i + 1] && !args[i + 1].startsWith('--'))
        databaseNetwork = args[++i];
    else
        throw new Error(
            'Use --services-running or --db-network <existing synthetic test network>.'
        );
}
if (servicesRunning && databaseNetwork)
    throw new Error('Choose --services-running or --db-network, not both.');
let compose: string | undefined;
let demo: Awaited<ReturnType<typeof startDemo>> | undefined;
const shutdown = () => {
    demo?.stop();
    if (compose) runCompose(compose, ['down', '--volumes']);
    process.exit(0);
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
const isListening = (port: number): Promise<boolean> =>
    new Promise(resolve => {
        const socket = createConnection({ host: '127.0.0.1', port });
        const finish = (listening: boolean) => {
            socket.destroy();
            resolve(listening);
        };
        socket.once('connect', () => finish(true));
        socket.once('error', () => finish(false));
    });
try {
    for (const port of servicesRunning ? [8812, 8813] : [4000, 4100, 5200, 8812, 8813]) {
        if (await isListening(port))
            throw new Error(
                `Port ${port} is already in use. Stop the previous demo, or use --services-running for existing synthetic APIs.`
            );
    }
    if (!servicesRunning) {
        compose = createDemoCompose(databaseNetwork);
        console.log(
            'Starting local test APIs. This uses Bun containers, without building the monorepo image.'
        );
        runCompose(compose, ['up', '-d']);
    }
    await waitForServices();
    demo = await startDemo();
    console.log(
        `\nPartner Connect demo: ${demo.url}\nChoose Set up demo in the browser. Ctrl+C stops the demo and its service containers.\n`
    );
} catch (error) {
    if (compose) runCompose(compose, ['down', '--volumes']);
    throw error;
}
