import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const REPO_ROOT = resolve(APP_ROOT, '../..');

/** The packaged DIDKit WASM from this checkout: browser journeys and SDK runs use these bytes. */
export const DIDKIT_WASM_PATH = join(
    REPO_ROOT,
    'packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm'
);

/**
 * Owned verification-stack endpoints. Ports are fixed because local did:web identities embed
 * them. LCA API is 5100 here (the tests/e2e compose stack uses 5200).
 */
export const STACK = {
    app: 'http://localhost:3000',
    brain: 'http://localhost:4000/trpc',
    brainApi: 'http://localhost:4000/api',
    cloud: 'http://localhost:4100/trpc',
    lcaApi: 'http://localhost:5100/trpc',
    brainDid: 'did:web:localhost%3A4000',
} as const;
