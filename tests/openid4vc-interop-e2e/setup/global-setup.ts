/**
 * Vitest globalSetup for the OID4VC interop suite.
 *
 * Brings up the walt.id docker stack (issuer-api + verifier-api),
 * waits until both advertise their well-known metadata, then tears
 * everything down on exit. The stack is shared across every spec so
 * the (slow) cold-start cost is paid exactly once per `vitest run`.
 *
 * Opt out with `E2E_MANAGE_DOCKER=false` when you already have
 * walt.id running locally and just want to run the specs against it.
 */
import { execa } from 'execa';

// walt.id prefixes OID4VCI metadata routes with `{standardVersion}` —
// metadata lives at `/draft13/.well-known/openid-credential-issuer`,
// NOT at the spec-bare `/.well-known/...` path. The plugin picks up
// the right URL automatically from each offer's `credential_issuer`
// field, so this probe only exists to confirm the service is up.
const ISSUER_METADATA = 'http://localhost:7002/draft13/.well-known/openid-credential-issuer';

// walt.id's verifier doesn't expose a root route — GET `/` returns
// 404. `/openid4vc/verify` is POST-only and returns 405 on GET, which
// is still enough to prove the listener is up.
const VERIFIER_PROBE = 'http://localhost:7003/openid4vc/verify';

const MANAGE_DOCKER = process.env.E2E_MANAGE_DOCKER !== 'false';
const COMPOSE_FILE = 'compose.yaml';

const fetchWithTimeout = async (url: string, timeout = 2_000): Promise<Response | null> => {
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

const isIssuerUp = async (): Promise<boolean> => {
    const res = await fetchWithTimeout(ISSUER_METADATA);
    if (!res || !res.ok) return false;

    // Sanity-check: the metadata we need exposes `credential_issuer`.
    try {
        const body = (await res.json()) as Record<string, unknown>;
        return typeof body.credential_issuer === 'string';
    } catch {
        return false;
    }
};

const isVerifierUp = async (): Promise<boolean> => {
    // `/openid4vc/verify` is POST-only. A GET that returns 405 (or
    // really any HTTP response) proves the listener is accepting
    // connections; `fetchWithTimeout` returns null on network error.
    const res = await fetchWithTimeout(VERIFIER_PROBE);
    return res !== null;
};

const waitFor = async (
    name: string,
    probe: () => Promise<boolean>,
    timeoutMs = 120_000,
    intervalMs = 2_000
): Promise<void> => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        if (await probe()) {
            console.log(`  [interop] ${name} is up`);
            return;
        }
        await new Promise(r => setTimeout(r, intervalMs));
    }

    throw new Error(`[interop] ${name} did not come up within ${timeoutMs}ms`);
};

export async function setup() {
    const t0 = performance.now();

    if (MANAGE_DOCKER) {
        console.log('[interop] docker compose up -d ...');
        await execa('docker', ['compose', '-f', COMPOSE_FILE, 'up', '-d'], {
            stdio: 'inherit',
        });
    } else {
        console.log('[interop] E2E_MANAGE_DOCKER=false — expecting stack already running');
    }

    await Promise.all([
        waitFor('waltid-issuer', isIssuerUp),
        waitFor('waltid-verifier', isVerifierUp),
    ]);

    console.log(
        `[interop] stack ready in ${((performance.now() - t0) / 1000).toFixed(1)}s`
    );

    return async () => {
        if (!MANAGE_DOCKER) {
            console.log('[interop] skipping docker teardown (E2E_MANAGE_DOCKER=false)');
            return;
        }

        console.log('[interop] docker compose down ...');
        await execa('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], {
            stdio: 'inherit',
        });
    };
}
