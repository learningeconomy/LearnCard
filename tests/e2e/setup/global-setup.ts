import { execa } from 'execa';
import { resolve } from 'node:path';
import { URLS } from '../tests/helpers/ports';

const DC = resolve(process.cwd(), '../../scripts/dc.sh');
const COMPOSE_FILE = resolve(process.cwd(), 'compose.yaml');

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 200) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });

        clearTimeout(timeoutId);

        return response;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') throw new Error(`Request timed out after ${timeout}ms`);

        throw error;
    }
};

const healthCheck = async (): Promise<boolean> => {
    try {
        return (await fetchWithTimeout(URLS.brainHealthCheck))?.status === 200;
    } catch (error) {
        return false;
    }
};

const MANAGE_DOCKER = process.env.E2E_MANAGE_DOCKER === 'true';

export async function setup() {
    let start = performance.now();

    if (MANAGE_DOCKER) {
        console.log('Starting docker...');
        await execa`${DC} -f ${COMPOSE_FILE} up -d --build`;
        console.log('Docker started in', ((performance.now() - start) / 1000).toFixed(2), 'seconds');
    } else {
        console.log('Skipping docker compose up (set E2E_MANAGE_DOCKER=true to enable)');
    }

    start = performance.now();

    console.log(`Waiting for health check... (${URLS.brainHealthCheck})`);

    do {
        await new Promise(resolve => setTimeout(resolve, 2000));
    } while (!(await healthCheck()));

    console.log(
        'Health check passed in',
        ((performance.now() - start) / 1000).toFixed(2),
        'seconds'
    );

    return async () => {
        if (MANAGE_DOCKER) {
            start = performance.now();
            console.log('Stopping docker...');
            await execa`${DC} -f ${COMPOSE_FILE} down`;
            console.log(
                'Docker stopped in',
                ((performance.now() - start) / 1000).toFixed(2),
                'seconds'
            );
        } else {
            console.log('Skipping docker compose down (set E2E_MANAGE_DOCKER=true to enable)');
        }
    };
}
