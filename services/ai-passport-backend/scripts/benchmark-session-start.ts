type StartupMode = 'legacy' | 'direct';

type BenchmarkConfig = {
    startupMode: StartupMode;
    wsUrl: string;
    origin: string;
    sessionToken: string;
    did: string;
    topic: string;
    samples: number;
    warmup: number;
    timeoutMs: number;
    jsonPath?: string;
};

type TimingFrame = {
    requestId?: string;
    operation?: string;
    [key: string]: unknown;
};

type Milestones = {
    startToSocketOpenMs?: number;
    startToPayloadSendMs?: number;
    startToFirstDeltaMs?: number;
    startToFinalPlanMs?: number;
    startToReadyMs?: number;
    sendToFirstDeltaMs?: number;
    sendToReadyMs?: number;
};

type Sample = {
    index: number;
    success: boolean;
    failure?: string;
    requestId?: string;
    threadId?: string;
    milestones: Milestones;
    timingFrames: TimingFrame[];
};

const DEFAULT_TOPIC = 'Explain practical budgeting for a first apartment';
const MILESTONE_KEYS = [
    'startToSocketOpenMs',
    'startToPayloadSendMs',
    'startToFirstDeltaMs',
    'startToFinalPlanMs',
    'startToReadyMs',
    'sendToFirstDeltaMs',
    'sendToReadyMs',
] as const satisfies readonly (keyof Milestones)[];

const WebSocketWithOptions = WebSocket as unknown as {
    new (url: string | URL, options?: Bun.WebSocketOptions): WebSocket;
};

const usage = (): never => {
    console.error(
        `Usage: SESSION_BENCHMARK_TOKEN=<token> bun run benchmark:session-start -- --did <did> [options]\n\nOptions:\n  --startup-mode legacy|direct  Startup protocol (default: direct)\n  --ws-url <url>                WebSocket URL (default: ws://localhost:3001)\n  --origin <origin>             Allowed request origin (default: http://localhost:4321)\n  --did <did>                   Benchmark learner DID (required)\n  --topic <topic>               Session topic\n  --samples <count>             Measured samples (default: 10)\n  --warmup <count>              Excluded warm-up samples (default: 1)\n  --timeout-ms <milliseconds>   Per-sample timeout (default: 32000)\n  --json <path>                 Write raw samples and summary as JSON`
    );
    process.exit(1);
};

const parsePositiveInteger = (value: string | undefined, flag: string): number => {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 0 || (flag !== '--warmup' && parsed === 0)) {
        throw new Error(
            `${flag} must be ${flag === '--warmup' ? 'a non-negative' : 'a positive'} integer`
        );
    }

    return parsed;
};

const parseArgs = (): BenchmarkConfig => {
    const values = new Map<string, string>();
    const args = process.argv.slice(2);

    for (let index = 0; index < args.length; index += 2) {
        const flag = args[index];
        const value = args[index + 1];

        if (!flag?.startsWith('--') || value === undefined) usage();

        values.set(flag, value);
    }

    const startupMode = values.get('--startup-mode') ?? 'direct';

    if (startupMode !== 'legacy' && startupMode !== 'direct') {
        throw new Error('--startup-mode must be legacy or direct');
    }

    const did = values.get('--did') ?? process.env.SESSION_BENCHMARK_DID;
    const sessionToken = process.env.SESSION_BENCHMARK_TOKEN;

    if (!did) throw new Error('--did or SESSION_BENCHMARK_DID is required');
    if (!sessionToken) {
        throw new Error('SESSION_BENCHMARK_TOKEN is required');
    }

    return {
        startupMode,
        wsUrl: values.get('--ws-url') ?? 'ws://localhost:3001',
        origin:
            values.get('--origin') ??
            process.env.SESSION_BENCHMARK_ORIGIN ??
            'http://localhost:4321',
        sessionToken,
        did,
        topic: values.get('--topic') ?? DEFAULT_TOPIC,
        samples: parsePositiveInteger(values.get('--samples') ?? '10', '--samples'),
        warmup: parsePositiveInteger(values.get('--warmup') ?? '1', '--warmup'),
        timeoutMs: parsePositiveInteger(values.get('--timeout-ms') ?? '32000', '--timeout-ms'),
        jsonPath: values.get('--json'),
    };
};

const roundDuration = (start: number, end = performance.now()): number =>
    Math.round((end - start) * 100) / 100;

const containsVisiblePlanData = (value: unknown): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (!value || typeof value !== 'object') return false;

    return Object.values(value).some(containsVisiblePlanData);
};

const toHttpBaseUrl = (wsUrl: string): URL => {
    const url = new URL(wsUrl);

    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    url.pathname = '/';
    url.search = '';
    url.hash = '';

    return url;
};

const endpoint = (base: URL, pathname: string): URL => new URL(pathname, base);

const authenticatedFetch = (
    config: BenchmarkConfig,
    httpBase: URL,
    pathname: string,
    init: RequestInit = {}
): Promise<Response> => {
    const headers = new Headers(init.headers);

    headers.set('Authorization', `Bearer ${config.sessionToken}`);
    headers.set('Origin', config.origin);

    return fetch(endpoint(httpBase, pathname), { ...init, headers });
};

const validateBenchmarkSession = async (config: BenchmarkConfig, httpBase: URL): Promise<void> => {
    const response = await authenticatedFetch(config, httpBase, '/auth/session');

    if (!response.ok) {
        throw new Error(`Session validation failed (${response.status} ${response.statusText})`);
    }

    const session = (await response.json()) as { did?: unknown };

    if (session.did !== config.did) {
        throw new Error(
            `Session DID ${String(session.did)} does not match benchmark DID ${config.did}`
        );
    }
};

const issueWebSocketTicket = async (config: BenchmarkConfig, httpBase: URL): Promise<string> => {
    const response = await authenticatedFetch(config, httpBase, '/auth/websocket-ticket', {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error(
            `WebSocket ticket request failed (${response.status} ${response.statusText})`
        );
    }

    const { ticket } = (await response.json()) as { ticket?: unknown };

    if (typeof ticket !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(ticket)) {
        throw new Error('WebSocket ticket response was invalid');
    }

    return ticket;
};

const performLegacyPreflight = async (config: BenchmarkConfig, httpBase: URL): Promise<void> => {
    const response = await authenticatedFetch(config, httpBase, '/api/chat/active-session-status');

    if (!response.ok) {
        throw new Error(`HTTP preflight failed (${response.status} ${response.statusText})`);
    }

    const activeSession = (await response.json()) as {
        activeThreadId?: string | null;
    };

    void authenticatedFetch(config, httpBase, '/threads/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            threadId: activeSession.activeThreadId,
            sendSummary: false,
        }),
    }).catch(() => undefined);
};

const deleteMeasuredThread = async (
    config: BenchmarkConfig,
    httpBase: URL,
    threadId: string | undefined
): Promise<void> => {
    if (!threadId) return;

    try {
        await authenticatedFetch(
            config,
            httpBase,
            `/threads?threadId=${encodeURIComponent(threadId)}`,
            { method: 'DELETE' }
        );
    } catch {}
};

const runSample = async (config: BenchmarkConfig, index: number): Promise<Sample> => {
    const startedAt = performance.now();
    const httpBase = toHttpBaseUrl(config.wsUrl);
    const milestones: Milestones = {};
    const timingFrames: TimingFrame[] = [];
    let payloadSentAt: number | undefined;
    let requestId: string | undefined;
    let threadId: string | undefined;
    let ready = false;
    let socket: WebSocket | undefined;

    const finish = async (sample: Sample): Promise<Sample> => {
        if (socket && socket.readyState < WebSocket.CLOSING) socket.close();

        await deleteMeasuredThread(config, httpBase, threadId);

        sample.requestId = requestId;
        sample.threadId = threadId;
        sample.timingFrames = requestId
            ? timingFrames.filter(frame => frame.requestId === requestId)
            : [];

        return sample;
    };

    try {
        if (config.startupMode === 'legacy') {
            await performLegacyPreflight(config, httpBase);
        }

        const wsUrl = new URL(config.wsUrl);
        const ticket = await issueWebSocketTicket(config, httpBase);

        const result = await new Promise<Sample>((resolve, reject) => {
            let settled = false;
            const settle = (callback: () => void): void => {
                if (settled) return;

                settled = true;
                clearTimeout(timeout);
                callback();
            };
            const timeout = setTimeout(() => {
                settle(() => reject(new Error(`Sample timed out after ${config.timeoutMs}ms`)));
            }, config.timeoutMs);

            socket = new WebSocketWithOptions(wsUrl, {
                protocols: ['ai-passport', `ai-passport-ticket.${ticket}`],
                headers: { Origin: config.origin },
            });

            socket.onopen = () => {
                milestones.startToSocketOpenMs = roundDuration(startedAt);
                payloadSentAt = performance.now();

                socket?.send(
                    JSON.stringify({
                        action: 'start_topic',
                        topic: config.topic,
                        introStreamMode: 'structured',
                        mode: 'ai-tutor',
                    })
                );

                milestones.startToPayloadSendMs = roundDuration(startedAt, payloadSentAt);
            };

            socket.onmessage = event => {
                let data: Record<string, unknown>;

                try {
                    data = JSON.parse(String(event.data)) as Record<string, unknown>;
                } catch {
                    return;
                }

                if (data.event === 'session_start_accepted' && typeof data.requestId === 'string') {
                    requestId = data.requestId;
                }

                if (data.event === 'timing' && data.data && typeof data.data === 'object') {
                    const timing = data.data as TimingFrame;

                    if (typeof timing.requestId !== 'string') return;
                    if (requestId && timing.requestId !== requestId) return;

                    requestId ??= timing.requestId;
                    timingFrames.push(timing);
                }

                if (
                    milestones.startToFirstDeltaMs === undefined &&
                    data.event === 'plan_structured_delta' &&
                    containsVisiblePlanData(data.planData)
                ) {
                    const observedAt = performance.now();

                    milestones.startToFirstDeltaMs = roundDuration(startedAt, observedAt);
                    if (payloadSentAt !== undefined) {
                        milestones.sendToFirstDeltaMs = roundDuration(payloadSentAt, observedAt);
                    }
                }

                if (
                    milestones.startToFinalPlanMs === undefined &&
                    data.event === 'plan_structured'
                ) {
                    milestones.startToFinalPlanMs = roundDuration(startedAt);
                }

                if (data.event === 'session_start_error') {
                    const code = typeof data.code === 'string' ? data.code : 'start_failed';

                    settle(() => reject(new Error(`Backend session_start_error: ${code}`)));
                    return;
                }

                if (data.event === 'plan_ready') {
                    const observedAt = performance.now();

                    ready = true;
                    threadId = typeof data.threadId === 'string' ? data.threadId : undefined;
                    milestones.startToReadyMs = roundDuration(startedAt, observedAt);
                    if (payloadSentAt !== undefined) {
                        milestones.sendToReadyMs = roundDuration(payloadSentAt, observedAt);
                    }

                    settle(() => resolve({ index, success: true, milestones, timingFrames }));
                }
            };

            socket.onerror = () => {
                settle(() => reject(new Error('WebSocket error before readiness')));
            };

            socket.onclose = event => {
                if (ready) return;

                settle(() =>
                    reject(
                        new Error(
                            `WebSocket closed before readiness (${event.code}${event.reason ? `: ${event.reason}` : ''})`
                        )
                    )
                );
            };
        });

        return finish(result);
    } catch (error) {
        return finish({
            index,
            success: false,
            failure: error instanceof Error ? error.message : String(error),
            milestones,
            timingFrames,
        });
    }
};

const percentile = (values: number[], fraction: number): number | null => {
    if (values.length === 0) return null;

    const sorted = [...values].sort((left, right) => left - right);
    const index = Math.max(0, Math.ceil(sorted.length * fraction) - 1);

    return sorted[index] ?? null;
};

const summarize = (samples: Sample[]) => {
    const milestones = Object.fromEntries(
        MILESTONE_KEYS.map(key => {
            const values = samples.flatMap(sample => {
                const value = sample.milestones[key];

                return sample.success && value !== undefined ? [value] : [];
            });

            return [key, { median: percentile(values, 0.5), p95: percentile(values, 0.95) }];
        })
    );

    return {
        measuredSamples: samples.length,
        successes: samples.filter(sample => sample.success).length,
        failures: samples.filter(sample => !sample.success).length,
        milestones,
    };
};

const main = async (): Promise<void> => {
    const config = parseArgs();
    const httpBase = toHttpBaseUrl(config.wsUrl);

    await validateBenchmarkSession(config, httpBase);

    const warmups: Sample[] = [];
    const samples: Sample[] = [];

    console.log(
        `Benchmarking ${config.startupMode} startup: ${config.warmup} warm-up, ${config.samples} measured sample(s)`
    );

    for (let index = 0; index < config.warmup; index += 1) {
        const sample = await runSample(config, -(index + 1));

        warmups.push(sample);
        console.log(`warm-up ${index + 1}: ${sample.success ? 'ready' : sample.failure}`);
    }

    for (let index = 0; index < config.samples; index += 1) {
        const sample = await runSample(config, index + 1);

        samples.push(sample);
        console.log(
            `sample ${index + 1}: ${sample.success ? `first=${sample.milestones.startToFirstDeltaMs}ms ready=${sample.milestones.startToReadyMs}ms` : sample.failure}`
        );
    }

    const summary = summarize(samples);
    const output = {
        generatedAt: new Date().toISOString(),
        startupMode: config.startupMode,
        wsUrl: config.wsUrl,
        topic: config.topic,
        warmupCount: config.warmup,
        sampleCount: config.samples,
        timeoutMs: config.timeoutMs,
        summary,
        warmups,
        samples,
    };

    console.log(JSON.stringify(summary, null, 2));

    if (config.jsonPath) {
        const path = Bun.file(config.jsonPath);
        const parent = config.jsonPath.includes('/')
            ? config.jsonPath.slice(0, config.jsonPath.lastIndexOf('/'))
            : '.';

        await Bun.$`mkdir -p ${parent}`.quiet();
        await Bun.write(path, `${JSON.stringify(output, null, 2)}\n`);
        console.log(`Wrote ${config.jsonPath}`);
    }

    if (summary.failures > 0) process.exitCode = 1;
};

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    usage();
});
