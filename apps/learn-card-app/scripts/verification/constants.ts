import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StackEndpoints, VerificationPorts } from './types';
export const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const REPO_ROOT = resolve(APP_ROOT, '../..');

/** The packaged DIDKit WASM from this checkout: browser journeys and SDK runs use these bytes. */
export const DIDKIT_WASM_PATH = join(
    REPO_ROOT,
    'packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm'
);

/** Derive every endpoint and did:web authority from the same persisted port allocation. */
export const stackEndpoints = (ports: VerificationPorts): StackEndpoints => ({
    ports,
    app: `http://localhost:${ports.app}`,
    brain: `http://localhost:${ports.brain}/trpc`,
    brainApi: `http://localhost:${ports.brain}/api`,
    cloud: `http://localhost:${ports.cloud}/trpc`,
    lcaApi: `http://localhost:${ports.api}/trpc`,
    brainDid: `did:web:localhost%3A${ports.brain}`,
    partner: `http://localhost:${ports.partner}`,
});
