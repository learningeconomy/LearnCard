import { describe, expect, it } from 'vitest';

import {
    CONNECTIVITY_PROBE_MARKER,
    CONNECTIVITY_PROBE_TIMEOUT_MS,
    probeConnectivity,
    validateProbeTarget,
    type ProbeDependencies,
} from './probeConnectivity';

const BASE_TIME = 1_700_000_000_000;

const createFakeTimers = () => {
    let currentTime = BASE_TIME;
    let seq = 0;
    const jobs = new Map<number, { at: number; fn: () => void }>();

    return {
        now: () => currentTime,
        setTimeoutFn: (fn: () => void, ms: number) => {
            const id = (seq += 1);
            jobs.set(id, { at: currentTime + ms, fn });
            return id;
        },
        clearTimeoutFn: (handle: unknown) => {
            jobs.delete(handle as number);
        },
        advance: (ms: number) => {
            const target = currentTime + ms;
            for (;;) {
                let nextId: number | undefined;
                let nextAt = Infinity;
                jobs.forEach((job, id) => {
                    if (job.at <= target && (nextId === undefined || job.at < nextAt)) {
                        nextAt = job.at;
                        nextId = id;
                    }
                });
                if (nextId === undefined) break;
                currentTime = nextAt;
                const job = jobs.get(nextId as number) as { at: number; fn: () => void };
                jobs.delete(nextId as number);
                job.fn();
            }
            currentTime = target;
        },
    };
};

const flush = async (): Promise<void> => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
};

const textResponse = (text: string, status = 200): Response =>
    new Response(text, { status, headers: { 'content-type': 'text/plain' } });

const streamResponse = (chunks: Uint8Array[]): Response => {
    let index = 0;
    const stream = new ReadableStream<Uint8Array>({
        pull: controller => {
            if (index < chunks.length) {
                controller.enqueue(chunks[index]);
                index += 1;
            } else {
                controller.close();
            }
        },
    });
    return new Response(stream, { status: 200 });
};

const encoder = new TextEncoder();

const markerResponse = (suffix = ''): Response =>
    streamResponse([...encoder.encode(CONNECTIVITY_PROBE_MARKER + suffix)]);

const depsWith = (overrides: Partial<ProbeDependencies> = {}): ProbeDependencies => {
    const timers = createFakeTimers();
    return {
        now: timers.now,
        setTimeoutFn: timers.setTimeoutFn,
        clearTimeoutFn: timers.clearTimeoutFn,
        randomId: () => 'testtoken',
        ...overrides,
    };
};

describe('validateProbeTarget', () => {
    it('accepts an https URL', () => {
        const result = validateProbeTarget('https://learncard.app/connectivity.txt');
        expect(result.ok).toBe(true);
    });

    it('rejects unparseable and non-http(s) URLs as invalid-url', () => {
        expect(validateProbeTarget('not a url').ok).toBe(false);
        const ftp = validateProbeTarget('ftp://learncard.app/connectivity.txt');
        expect(ftp.ok).toBe(false);
        if (!ftp.ok) expect(ftp.reason).toBe('invalid-url');
    });

    it('rejects plain http without the dev escape hatch', () => {
        const result = validateProbeTarget('http://learncard.app/connectivity.txt');
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('unsafe-origin');
    });

    it('allows plain http only with allowPlainHttp (web dev localhost)', () => {
        expect(validateProbeTarget('http://localhost:3000/connectivity.txt').ok).toBe(true);
        expect(
            validateProbeTarget({
                url: 'http://localhost:3000/connectivity.txt',
                allowPlainHttp: true,
            }).ok
        ).toBe(true);
    });

    it('refuses the bundled/app origin even over https', () => {
        const result = validateProbeTarget({
            url: 'https://localhost/connectivity.txt',
            disallowOrigins: ['https://localhost'],
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('unsafe-origin');
    });
});

describe('probeConnectivity', () => {
    it('verifies reachability on exact marker match', async () => {
        const outcome = await probeConnectivity('https://learncard.app/connectivity.txt', {
            ...depsWith(),
            fetchFn: async () => textResponse(CONNECTIVITY_PROBE_MARKER),
        });

        expect(outcome).toMatchObject({ kind: 'reachable', httpStatus: 200 });
    });

    it('tolerates trailing whitespace on the marker', async () => {
        const outcome = await probeConnectivity('https://learncard.app/connectivity.txt', {
            ...depsWith(),
            fetchFn: async () => textResponse(`${CONNECTIVITY_PROBE_MARKER}\n`),
        });

        expect(outcome.kind).toBe('reachable');
    });

    it('sends the required request options and a unique cache-busting query', async () => {
        const inits: RequestInfo[] = [];
        let token = 0;
        const deps = depsWith({ randomId: () => `token${(token += 1)}` });

        await probeConnectivity('https://learncard.app/connectivity.txt', {
            ...deps,
            fetchFn: async (input, init) => {
                inits.push(input as RequestInfo);
                expect(init).toMatchObject({
                    method: 'GET',
                    cache: 'no-store',
                    credentials: 'omit',
                    redirect: 'error',
                });
                expect(init?.signal).toBeDefined();
                return textResponse(CONNECTIVITY_PROBE_MARKER);
            },
        });

        await probeConnectivity('https://learncard.app/connectivity.txt', {
            ...deps,
            fetchFn: async () => textResponse(CONNECTIVITY_PROBE_MARKER),
        });

        expect(inits[0]).toContain('lc=token1');
        expect(inits[1]).toContain('lc=token2');
    });

    it('classifies http errors as inconclusive, not offline', async () => {
        const outcome = await probeConnectivity('https://learncard.app/connectivity.txt', {
            ...depsWith(),
            fetchFn: async () => textResponse('Not Found', 404),
        });

        expect(outcome).toMatchObject({ kind: 'inconclusive', reason: 'http-error', httpStatus: 404 });
    });

    it('classifies unexpected bodies as inconclusive', async () => {
        const outcome = await probeConnectivity('https://learncard.app/connectivity.txt', {
            ...depsWith(),
            fetchFn: async () => textResponse('<html>captcha portal</html>'),
        });

        expect(outcome).toMatchObject({ kind: 'inconclusive', reason: 'unexpected-body' });
    });

    it('classifies config errors as inconclusive without any fetch', async () => {
        let fetched = false;
        const outcome = await probeConnectivity({ url: 'https://localhost/connectivity.txt', disallowOrigins: ['https://localhost'] }, {
            ...depsWith(),
            fetchFn: async () => {
                fetched = true;
                return textResponse(CONNECTIVITY_PROBE_MARKER);
            },
        });

        expect(fetched).toBe(false);
        expect(outcome).toMatchObject({ kind: 'inconclusive', reason: 'unsafe-origin' });
    });

    it('classifies fetch rejection as unreachable network-error', async () => {
        const outcome = await probeConnectivity('https://learncard.app/connectivity.txt', {
            ...depsWith(),
            fetchFn: async () => {
                throw new TypeError('Failed to fetch');
            },
        });

        expect(outcome).toMatchObject({ kind: 'unreachable', reason: 'network-error' });
    });

    it('classifies deadline elapsing during fetch as a timeout', async () => {
        const timers = createFakeTimers();
        const outcome = await probeConnectivity('https://learncard.app/connectivity.txt', {
            now: timers.now,
            setTimeoutFn: timers.setTimeoutFn,
            clearTimeoutFn: timers.clearTimeoutFn,
            fetchFn: ((_url: string, init?: RequestInit) =>
                new Promise<Response>((_, reject) => {
                    (init?.signal as AbortSignal).addEventListener('abort', () => {
                        const error = new Error('aborted');
                        error.name = 'AbortError';
                        reject(error);
                    });
                })) as typeof fetch,
        });

        expect(outcome).toMatchObject({ kind: 'unreachable', reason: 'timeout' });
    });

    it('classifies deadline elapsing during body read as a timeout', async () => {
        const timers = createFakeTimers();
        const neverStream = new ReadableStream<Uint8Array>({
            pull: () => new Promise(() => undefined), // hangs forever
        });
        const hangingResponse = new Response(neverStream, { status: 200 });

        const pending = probeConnectivity('https://learncard.app/connectivity.txt', {
            now: timers.now,
            setTimeoutFn: timers.setTimeoutFn,
            clearTimeoutFn: timers.clearTimeoutFn,
            fetchFn: async () => hangingResponse,
        });

        await flush();
        timers.advance(CONNECTIVITY_PROBE_TIMEOUT_MS + 1);
        const outcome = await pending;

        expect(outcome).toMatchObject({ kind: 'unreachable', reason: 'timeout' });
    });

    it('bounds body consumption and still verifies the marker within the cap', async () => {
        let cancelled = false;
        const bigChunks = [...encoder.encode(CONNECTIVITY_PROBE_MARKER), ...new Uint8Array(2048).fill(97)];
        const stream = new ReadableStream<Uint8Array>({
            pull: controller => {
                if (bigChunks.length > 0) {
                    controller.enqueue(bigChunks.shift() as Uint8Array);
                } else if (!cancelled) {
                    // Would hang forever if the probe kept reading.
                    controller.close();
                }
            },
        });
        Object.defineProperty(stream, 'cancel', {
            value: () => {
                cancelled = true;
                return Promise.resolve();
            },
        });

        const response = new Response(stream as ReadableStream<Uint8Array>, { status: 200 });
        const outcome = await probeConnectivity('https://learncard.app/connectivity.txt', {
            ...depsWith(),
            fetchFn: async () => response,
        });

        expect(outcome.kind).toBe('reachable');
    });

    it('reports inconclusive when a huge wrong body exceeds the read cap', async () => {
        const outcome = await probeConnectivity('https://learncard.app/connectivity.txt', {
            ...depsWith(),
            fetchFn: async () => streamResponse([new Uint8Array(2048).fill(120)]), // 'x' * 2048
        });

        expect(outcome).toMatchObject({ kind: 'inconclusive', reason: 'unexpected-body' });
    });

    it('reports the elapsed duration on every outcome', async () => {
        let currentTime = BASE_TIME;
        const outcome = await probeConnectivity('https://learncard.app/connectivity.txt', {
            ...depsWith({ now: () => currentTime }),
            fetchFn: async () => {
                currentTime = BASE_TIME + 123;
                return textResponse(CONNECTIVITY_PROBE_MARKER);
            },
        });

        expect(outcome.kind === 'reachable' && outcome.durationMs).toBe(123);
    });
});
