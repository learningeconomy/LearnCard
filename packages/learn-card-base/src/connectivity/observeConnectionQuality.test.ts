import { describe, it, expect, vi } from 'vitest';

import {
    observeConnectionQuality,
    isLikelyTransportError,
    DEFAULT_MAX_OBSERVED_DURATION_MS,
    type ObserveConnectionQualityOptions,
    type ObservedConnectionSample,
} from './observeConnectionQuality';

type EntryOverrides = Partial<{
    name: string;
    duration: number;
    startTime: number;
    initiatorType: string;
    deliveryType: string;
    responseStatus: number;
}>;

const makeEntry = (overrides: EntryOverrides) =>
    ({
        // Real Resource Timing shape: entries ALWAYS carry an initiatorType
        // and a startTime in the performance.now() clock.
        name: 'https://network.learncard.com/trpc/some.procedure',
        duration: 400,
        startTime: 1000,
        initiatorType: 'fetch',
        ...overrides,
    } as PerformanceResourceTiming);

interface FakeObserverInstance {
    observeTypes: string[];
    disconnected: boolean;
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
}

type ObserverCallback = (list: { getEntries: () => PerformanceResourceTiming[] }) => void;

interface FakeObserverCtor {
    new (callback: ObserverCallback): FakeObserverInstance;
    instances: FakeObserverInstance[];
    lastCallback: ObserverCallback | null;
}

/**
 * Enforces REAL browser semantics: `resource` is the only valid entry type
 * for Resource Timing. Observing `fetch`/`xmlhttprequest` (initiatorType
 * values, not types) throws — exactly like Chrome/Safari/Firefox.
 */
const makeFakeObserverCtor = (supportedTypes: string[] = ['resource']) => {
    // Must be a real function expression — it is invoked with `new`.
    const Fake = function (this: unknown, callback: ObserverCallback) {
        const instance: FakeObserverInstance = {
            observeTypes: [],
            disconnected: false,
            observe: vi.fn(({ type }: { type: string }) => {
                if (!supportedTypes.includes(type)) {
                    throw new Error(
                        `Failed to construct 'PerformanceObserver': The provided value '${type}' is not a valid PerformanceEntryType.`
                    );
                }
                instance.observeTypes.push(type);
            }),
            disconnect: vi.fn(() => {
                instance.disconnected = true;
            }),
        };
        Fake.instances.push(instance);
        Fake.lastCallback = callback;
        return instance;
    } as unknown as FakeObserverCtor;

    Fake.instances = [];
    Fake.lastCallback = null;
    return Fake;
};

const makeOptions = (
    overrides: Partial<ObserveConnectionQualityOptions> = {}
): ObserveConnectionQualityOptions => {
    const ctor = overrides.PerformanceObserverCtor ?? makeFakeObserverCtor();
    return {
        origins: ['https://network.learncard.com', 'https://cloud.learncard.com'],
        onSample: vi.fn(),
        PerformanceObserverCtor: ctor as unknown as typeof PerformanceObserver,
        ...overrides,
    };
};

const emit = (fake: FakeObserverCtor, entries: PerformanceResourceTiming[]): void => {
    const callback = fake.lastCallback;
    if (!callback) throw new Error('observer callback not registered');
    callback({ getEntries: () => entries });
};

describe('observeConnectionQuality', () => {
    it('returns a safe no-op (null) when PerformanceObserver is unsupported', () => {
        // Node (and some webviews) expose a global PerformanceObserver — hide
        // it to simulate an engine without Resource Timing support.
        vi.stubGlobal('PerformanceObserver', undefined);
        try {
            const result = observeConnectionQuality({
                origins: ['https://network.learncard.com'],
                onSample: vi.fn(),
            });
            expect(result).toBeNull();
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('returns null when no origins are configured', () => {
        const Fake = makeFakeObserverCtor();
        const result = observeConnectionQuality({
            origins: [],
            onSample: vi.fn(),
            PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
        });
        expect(result).toBeNull();
    });

    it('observes the single valid `resource` entry type once, without buffering history', () => {
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({ PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver })
        );

        expect(Fake.instances).toHaveLength(1);
        // `fetch`/`xmlhttprequest` are initiatorType VALUES — observing them
        // throws on every real browser. Exactly one `resource` observation.
        expect(Fake.instances[0].observeTypes).toEqual(['resource']);
        expect(Fake.instances[0].observe).toHaveBeenCalledTimes(1);
        expect(Fake.instances[0].observe).toHaveBeenCalledWith({
            type: 'resource',
            buffered: false,
        });
        observer?.disconnect();
    });

    it('reports completed first-party fetch requests as healthy samples with duration', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
            })
        );

        emit(Fake, [
            makeEntry({ name: 'https://network.learncard.com/trpc/getProfile', duration: 2500 }),
        ]);

        expect(onSample).toHaveBeenCalledTimes(1);
        const sample = onSample.mock.calls[0][0] as ObservedConnectionSample;
        expect(sample).toMatchObject({
            ok: true,
            durationMs: 2500,
            url: 'https://network.learncard.com/trpc/getProfile',
        });
        expect(typeof sample.at).toBe('number');
        observer?.disconnect();
    });

    it('ignores entries from non-first-party origins', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
            })
        );

        emit(Fake, [
            makeEntry({ name: 'https://evil.example.com/trpc/getProfile' }),
            makeEntry({ name: 'https://static.learncard.com/assets/logo.png' }),
        ]);

        expect(onSample).not.toHaveBeenCalled();
        observer?.disconnect();
    });

    it('filters entries by initiatorType: only fetch/xmlhttprequest count', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
            })
        );

        emit(Fake, [
            // Same first-party origin, wrong initiator: images, scripts and
            // styles are cache/CDN-shaped and must never be latency evidence.
            makeEntry({
                name: 'https://network.learncard.com/assets/logo.png',
                initiatorType: 'img',
                duration: 6000,
            }),
            makeEntry({
                name: 'https://network.learncard.com/assets/app.js',
                initiatorType: 'script',
                duration: 6000,
            }),
            makeEntry({
                name: 'https://network.learncard.com/assets/app.css',
                initiatorType: 'css',
                duration: 6000,
            }),
            makeEntry({ initiatorType: 'xmlhttprequest', duration: 400 }),
            makeEntry({ initiatorType: 'fetch', duration: 500 }),
        ]);

        expect(onSample).toHaveBeenCalledTimes(2);
        expect((onSample.mock.calls[0][0] as ObservedConnectionSample).durationMs).toBe(400);
        expect((onSample.mock.calls[1][0] as ObservedConnectionSample).durationMs).toBe(500);
        observer?.disconnect();
    });

    it('drops entries with a missing/unknown initiatorType', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
            })
        );

        emit(Fake, [makeEntry({ initiatorType: undefined })]);
        expect(onSample).not.toHaveBeenCalled();
        observer?.disconnect();
    });

    it('ignores the connectivity probe itself (probe duplicates)', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
                origins: ['https://learncard.app'],
            })
        );

        emit(Fake, [
            makeEntry({
                name: 'https://learncard.app/connectivity.txt?lc=abc123',
                duration: 30,
            }),
            makeEntry({ name: 'https://learncard.app/trpc/other', duration: 30 }),
        ]);

        // Only the non-probe request survives.
        expect(onSample).toHaveBeenCalledTimes(1);
        expect((onSample.mock.calls[0][0] as ObservedConnectionSample).url).toContain(
            '/trpc/other'
        );
        observer?.disconnect();
    });

    it('supports extra excluded pathnames', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
                excludePathnames: ['/trpc/noisy.procedure'],
            })
        );

        emit(Fake, [makeEntry({ name: 'https://network.learncard.com/trpc/noisy.procedure' })]);

        expect(onSample).not.toHaveBeenCalled();
        observer?.disconnect();
    });

    it('ignores known HTTP errors where responseStatus is available', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
            })
        );

        emit(Fake, [
            makeEntry({ responseStatus: 500, duration: 5000 }),
            makeEntry({ responseStatus: 404, duration: 100 }),
            makeEntry({ responseStatus: 200, duration: 300 }),
        ]);

        expect(onSample).toHaveBeenCalledTimes(1);
        expect((onSample.mock.calls[0][0] as ObservedConnectionSample).durationMs).toBe(300);
        observer?.disconnect();
    });

    it('ignores known cache hits (deliveryType cache)', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
            })
        );

        emit(Fake, [makeEntry({ deliveryType: 'cache', duration: 5 })]);

        expect(onSample).not.toHaveBeenCalled();
        observer?.disconnect();
    });

    it('ignores long streams beyond the max duration', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
            })
        );

        emit(Fake, [
            makeEntry({ duration: DEFAULT_MAX_OBSERVED_DURATION_MS + 1 }),
            makeEntry({ duration: 29_000 }),
        ]);

        expect(onSample).toHaveBeenCalledTimes(1);
        expect((onSample.mock.calls[0][0] as ObservedConnectionSample).durationMs).toBe(29_000);
        observer?.disconnect();
    });

    it('drops samples delivered while backgrounded', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
                isForeground: () => false,
            })
        );

        emit(Fake, [makeEntry({ duration: 300 })]);

        expect(onSample).not.toHaveBeenCalled();
        observer?.disconnect();
    });

    it('drops a request that started before the last resume (background-spanning) and counts fresh foreground requests', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        let foreground = true;
        let perfTime = 10_000;
        const foregroundListeners: ((fg: boolean) => void)[] = [];
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
                isForeground: () => foreground,
                onForegroundChange: listener => {
                    foregroundListeners.push(listener);
                    return () => {
                        foregroundListeners.splice(foregroundListeners.indexOf(listener), 1);
                    };
                },
                performanceNow: () => perfTime,
            })
        );

        // Request started 500ms before the observer existed, delivered now:
        // entirely in the initial foreground stretch is unknowable — the
        // conservative epoch (observer creation) excludes it.
        emit(Fake, [makeEntry({ startTime: 9_500, duration: 600 })]);
        expect(onSample).not.toHaveBeenCalled();

        // Background, then resume at perfTime 60_000.
        foregroundListeners.forEach(listener => listener(false));
        perfTime = 60_000;
        foregroundListeners.forEach(listener => listener(true));
        foreground = true;

        // A request that STARTED before the resume (spanned the background)
        // delivered afterwards: must NOT count as slow foreground evidence.
        emit(Fake, [makeEntry({ startTime: 59_000, duration: 25_000 })]);
        expect(onSample).not.toHaveBeenCalled();

        // A request started AND completed inside the current foreground
        // stretch counts normally.
        perfTime = 61_000;
        emit(Fake, [makeEntry({ startTime: 60_500, duration: 400 })]);
        expect(onSample).toHaveBeenCalledTimes(1);
        expect((onSample.mock.calls[0][0] as ObservedConnectionSample).durationMs).toBe(400);

        // Another background/resume moves the epoch forward: requests started
        // during the PREVIOUS foreground stretch are now excluded too.
        foregroundListeners.forEach(listener => listener(false));
        perfTime = 120_000;
        foregroundListeners.forEach(listener => listener(true));
        emit(Fake, [makeEntry({ startTime: 60_900, duration: 300 })]);
        expect(onSample).toHaveBeenCalledTimes(1);

        observer?.disconnect();
    });

    it('stops listening to foreground transitions after disconnect', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        let perfTime = 1_000;
        const foregroundListeners: ((fg: boolean) => void)[] = [];
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
                onForegroundChange: listener => {
                    foregroundListeners.push(listener);
                    return () => {
                        foregroundListeners.splice(foregroundListeners.indexOf(listener), 1);
                    };
                },
                performanceNow: () => perfTime,
            })
        );

        observer?.disconnect();
        // Post-disconnect transition callbacks are inert.
        foregroundListeners.forEach(listener => listener(false));
        perfTime = 5_000;
        foregroundListeners.forEach(listener => listener(true));
        emit(Fake, [makeEntry({ startTime: 4_900, duration: 100 })]);
        expect(onSample).not.toHaveBeenCalled();
    });

    it('degrades to a quiet no-op when the engine rejects the resource type', () => {
        const onSample = vi.fn();
        // Some engines lack Resource Timing entirely: `resource` throws.
        const Fake = makeFakeObserverCtor(['longtask']);
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
            })
        );

        // The rejection was swallowed: the observer still exists and can be
        // disconnected safely. (With no active subscription a real engine can
        // never deliver entries, so no sample can ever be reported.)
        expect(observer).not.toBeNull();
        expect(Fake.instances[0].observeTypes).toEqual([]);
        expect(() => observer?.disconnect()).not.toThrow();
        expect(Fake.instances[0].disconnected).toBe(true);
    });

    it('stops reporting after disconnect even if a callback already fired', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
            })
        );

        observer?.disconnect();
        emit(Fake, [makeEntry({})]);

        expect(onSample).not.toHaveBeenCalled();
        expect(Fake.instances[0].disconnected).toBe(true);
    });

    it('disconnect is idempotent', () => {
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({ PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver })
        );
        observer?.disconnect();
        expect(() => observer?.disconnect()).not.toThrow();
    });

    it('ignores malformed entry URLs', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
            })
        );

        emit(Fake, [makeEntry({ name: 'not a url at all' })]);

        expect(onSample).not.toHaveBeenCalled();
        observer?.disconnect();
    });
});

describe('isLikelyTransportError', () => {
    it('recognizes Chrome fetch transport failures', () => {
        expect(isLikelyTransportError(new TypeError('Failed to fetch'))).toBe(true);
    });

    it('recognizes Safari fetch transport failures', () => {
        expect(isLikelyTransportError(new TypeError('Load failed'))).toBe(true);
    });

    it('recognizes Firefox fetch transport failures', () => {
        expect(
            isLikelyTransportError(new TypeError('NetworkError when attempting to fetch resource.'))
        ).toBe(true);
    });

    it('recognizes webview transport phrasing', () => {
        expect(isLikelyTransportError(new TypeError('The network connection was lost.'))).toBe(
            true
        );
        expect(isLikelyTransportError(new Error('Network request failed'))).toBe(true);
    });

    it('never classifies cancellations or app deadlines', () => {
        const abort = new Error('Aborted');
        abort.name = 'AbortError';
        const timeout = new Error('The operation was aborted due to timeout');
        timeout.name = 'TimeoutError';

        expect(isLikelyTransportError(abort)).toBe(false);
        expect(isLikelyTransportError(timeout)).toBe(false);
    });

    it('never classifies HTTP status errors', () => {
        const httpError = Object.assign(new Error('Unauthorized'), { status: 401 });
        const statusCodeError = Object.assign(new Error('Server error'), { statusCode: 500 });
        const responseError = Object.assign(new Error('Request failed'), {
            response: { status: 400 },
        });

        expect(isLikelyTransportError(httpError)).toBe(false);
        expect(isLikelyTransportError(statusCodeError)).toBe(false);
        expect(isLikelyTransportError(responseError)).toBe(false);
    });

    it('never classifies arbitrary application errors', () => {
        expect(isLikelyTransportError(new Error('Something broke'))).toBe(false);
        expect(isLikelyTransportError(new Error('UNAUTHORIZED'))).toBe(false);
        expect(
            isLikelyTransportError(
                new TypeError("Cannot read properties of undefined (reading 'x')")
            )
        ).toBe(false);
        expect(isLikelyTransportError('Failed to fetch')).toBe(false);
        expect(isLikelyTransportError(null)).toBe(false);
        expect(isLikelyTransportError(undefined)).toBe(false);
    });
});
