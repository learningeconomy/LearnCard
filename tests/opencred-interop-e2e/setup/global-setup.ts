import { execa } from 'execa';

const OPENCRED_HEALTH = 'http://localhost:22080/health/live';
const OPENCRED_WELL_KNOWN_DID = 'http://localhost:22080/.well-known/did.json';

const MANAGE_DOCKER = process.env.E2E_MANAGE_DOCKER !== 'false';
const COMPOSE_FILE = 'compose.yaml';

const fetchWithTimeout = async (url: string, timeout = 5_000): Promise<Response | null> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);

    try {
        return await fetch(url, { signal: ctrl.signal });
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
};

const isOpencredHealthy = async (): Promise<boolean> => {
    const res = await fetchWithTimeout(OPENCRED_HEALTH);
    return res !== null && res.status >= 200 && res.status < 300;
};

const isDidDocPublished = async (): Promise<boolean> => {
    const res = await fetchWithTimeout(OPENCRED_WELL_KNOWN_DID);
    if (!res || !res.ok) return false;
    try {
        const body = (await res.json()) as { id?: string };
        return typeof body.id === 'string' && body.id.startsWith('did:web:');
    } catch {
        return false;
    }
};

const waitFor = async (
    name: string,
    probe: () => Promise<boolean>,
    timeoutMs = 300_000,
    intervalMs = 2_000
): Promise<void> => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        if (await probe()) {
            console.log(`  [opencred-interop] ${name} is up`);
            return;
        }
        await new Promise(r => setTimeout(r, intervalMs));
    }

    throw new Error(`[opencred-interop] ${name} did not come up within ${timeoutMs}ms`);
};

export async function setup() {
    const t0 = performance.now();

    if (MANAGE_DOCKER) {
        console.log('[opencred-interop] docker compose up -d (may build image on first run) ...');
        await execa('docker', ['compose', '-f', COMPOSE_FILE, 'up', '-d', '--build'], {
            stdio: 'inherit',
        });
    } else {
        console.log('[opencred-interop] E2E_MANAGE_DOCKER=false — expecting stack already running');
    }

    await waitFor('opencred-server', isOpencredHealthy, 300_000);
    await waitFor('opencred-did-doc', isDidDocPublished, 30_000);

    console.log(
        `[opencred-interop] stack ready in ${((performance.now() - t0) / 1000).toFixed(1)}s`
    );

    return async () => {
        if (!MANAGE_DOCKER) {
            console.log('[opencred-interop] skipping docker teardown (E2E_MANAGE_DOCKER=false)');
            return;
        }

        console.log('[opencred-interop] docker compose down ...');
        await execa('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], {
            stdio: 'inherit',
        });
    };
}
