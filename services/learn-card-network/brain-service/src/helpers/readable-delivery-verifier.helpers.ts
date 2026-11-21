import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import type { UnsignedVC, VerificationCheck } from '@learncard/types';
import type { DeliveryVerificationChecks } from 'types/readable-delivery';
import { fetchVerificationResource } from './notification-webhook-fetch.helpers';

// A dedicated WASM worker has no native DIDKit HTTP client. Every fetch is mediated
// by the parent and the worker is terminated after each verification. Never replace
// process-global fetch: other requests may be using it concurrently.
const workerSource = `
const { parentPort, workerData } = require('node:worker_threads');
const { readFile } = require('node:fs/promises');
const pending = new Map();
let nextId = 0;
globalThis.fetch = async (input, options) => {
    const request = new Request(input, options);
    if (request.method !== 'GET') throw new Error('Only verification document reads are allowed');
    const id = nextId++;
    return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject, url: request.url });
        parentPort.postMessage({ type: 'fetch', id, url: request.url });
    });
};
parentPort.on('message', message => {
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error('Verification document unavailable'));
    else {
        const response = new Response(message.body, { headers: { 'Content-Type': 'application/json' } });
        Object.defineProperty(response, 'url', { value: request.url });
        request.resolve(response);
    }
});
(async () => {
    const didkit = await import(workerData.module);
    await didkit.default({ module_or_path: await readFile(workerData.wasm) });
    const verify = async checks => JSON.parse(await didkit.verifyCredential(
        JSON.stringify(workerData.credential), JSON.stringify({ checks }), '{}'
    ));
    const proof = await verify(['proof']);
    const status = workerData.credential.credentialStatus ? await verify(['credentialStatus']) : null;
    parentPort.postMessage({ type: 'result', proof, status });
})().catch(() => parentPort.postMessage({ type: 'error' }));
`;

const validDates = (credential: UnsignedVC): boolean => {
    const now = Date.now();
    for (const [value, start] of [
        [credential.issuanceDate, true],
        [credential.validFrom, true],
        [credential.expirationDate, false],
        [credential.validUntil, false],
    ] as const) {
        if (value === undefined) continue;
        const timestamp = Date.parse(value);
        if (!Number.isFinite(timestamp) || (start ? timestamp > now : timestamp <= now))
            return false;
    }
    return true;
};

const passed = (result: VerificationCheck, check: string): boolean =>
    result.errors.length === 0 && result.warnings.length === 0 && result.checks.includes(check);

/** Verify uploaded credentials with bounded public-only reads and a killable CPU budget. */
export const verifyDeliveryCredential = async (
    credential: UnsignedVC,
    localOrigin?: string,
    signal?: AbortSignal
): Promise<DeliveryVerificationChecks> => {
    const dates = validDates(credential) ? 'valid' : 'invalid';
    const fallback: DeliveryVerificationChecks = {
        proof: credential.proof ? 'unavailable' : 'invalid',
        status: credential.credentialStatus ? 'unavailable' : 'not_applicable',
        dates,
    };
    if (!credential.proof || signal?.aborted) return fallback;
    const bundledWasm = join(__dirname, 'didkit_wasm_bg.wasm');
    const wasm = existsSync(bundledWasm)
        ? bundledWasm
        : require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm');
    const bundledModule = join(__dirname, 'readable-delivery-didkit.mjs');
    const modulePath = existsSync(bundledModule)
        ? bundledModule
        : join(dirname(wasm), 'didkit_wasm.js');
    const controller = new AbortController();
    const worker = new Worker(workerSource, {
        eval: true,
        workerData: { credential, wasm, module: pathToFileURL(modulePath).href },
        stdout: true,
        stderr: true,
        resourceLimits: { maxOldGenerationSizeMb: 128 },
    });
    // Never forward WASM diagnostics or credential contents to application logs.
    worker.stdout?.resume();
    worker.stderr?.resume();
    let requests = 0;
    let failedFetch = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let abort: (() => void) | undefined;
    try {
        return await new Promise<DeliveryVerificationChecks>(resolve => {
            timer = setTimeout(() => resolve(fallback), 12_000);
            abort = () => resolve(fallback);
            signal?.addEventListener('abort', abort, { once: true });
            worker.once('error', () => resolve(fallback));
            worker.once('exit', () => resolve(fallback));
            worker.on('message', async message => {
                if (message.type === 'fetch') {
                    try {
                        if (++requests > 24) throw new Error('Verification read budget exceeded');
                        const body = await fetchVerificationResource(
                            message.url,
                            controller.signal,
                            localOrigin
                        );
                        worker.postMessage({ id: message.id, body });
                    } catch {
                        failedFetch = true;
                        worker.postMessage({ id: message.id, error: true });
                    }
                } else if (message.type === 'result') {
                    resolve({
                        proof: passed(message.proof, 'proof')
                            ? 'valid'
                            : failedFetch
                              ? 'unavailable'
                              : 'invalid',
                        status: !credential.credentialStatus
                            ? 'not_applicable'
                            : passed(message.status, 'credentialStatus') ||
                                passed(message.status, 'status')
                              ? 'valid'
                              : failedFetch
                                ? 'unavailable'
                                : 'invalid',
                        dates,
                    });
                } else resolve(fallback);
            });
        });
    } finally {
        clearTimeout(timer);
        if (abort) signal?.removeEventListener('abort', abort);
        controller.abort();
        await worker.terminate();
    }
};
