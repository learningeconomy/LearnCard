import { execa } from 'execa';

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

const healthCheckBrainA = async (): Promise<boolean> => {
    try {
        return (await fetchWithTimeout('http://localhost:4000/api/health-check'))?.status === 200;
    } catch (error) {
        return false;
    }
};

const healthCheckBrainB = async (): Promise<boolean> => {
    try {
        return (await fetchWithTimeout('http://localhost:4001/api/health-check'))?.status === 200;
    } catch (error) {
        return false;
    }
};

const MANAGE_DOCKER = process.env.E2E_MANAGE_DOCKER !== 'false';

export async function setup() {
    let start = performance.now();

    if (MANAGE_DOCKER) {
        console.log('Starting federation docker environment...');
        await execa`docker compose up -d --build`;
        console.log(
            'Docker started in',
            ((performance.now() - start) / 1000).toFixed(2),
            'seconds'
        );
    } else {
        console.log('Skipping docker compose up (set E2E_MANAGE_DOCKER=true to enable)');
    }

    start = performance.now();

    console.log('Waiting for brain-a health check...');
    do {
        await new Promise(resolve => setTimeout(resolve, 2000));
    } while (!(await healthCheckBrainA()));
    console.log('Brain-a health check passed');

    console.log('Waiting for brain-b health check...');
    do {
        await new Promise(resolve => setTimeout(resolve, 2000));
    } while (!(await healthCheckBrainB()));
    console.log('Brain-b health check passed');

    console.log(
        'Both services healthy in',
        ((performance.now() - start) / 1000).toFixed(2),
        'seconds'
    );

    return async () => {
        if (MANAGE_DOCKER) {
            start = performance.now();
            console.log('Stopping docker...');
            await execa`docker compose down`;
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
