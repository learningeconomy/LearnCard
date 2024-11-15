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

const healthCheck = async (): Promise<boolean> => {
    try {
        return (await fetchWithTimeout('http://localhost:4000/api/health-check'))?.status === 200;
    } catch (error) {
        return false;
    }
};

export async function setup() {
    let start = performance.now();
    console.log('Starting docker...');

    await execa`docker compose up -d`;

    console.log('Docker started in', ((performance.now() - start) / 1000).toFixed(2), 'seconds');

    start = performance.now();

    console.log('Waiting for health check...');

    do {
        await new Promise(resolve => setTimeout(resolve, 2000));
    } while (!(await healthCheck()));

    console.log(
        'Health check passed in',
        ((performance.now() - start) / 1000).toFixed(2),
        'seconds'
    );

    return async () => {
        start = performance.now();
        console.log('Stopping docker...');

        await execa`docker compose down`;

        console.log(
            'Docker stopped in',
            ((performance.now() - start) / 1000).toFixed(2),
            'seconds'
        );
    };
}
