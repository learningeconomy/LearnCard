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
    deliveryType: string;
    responseStatus: number;
}>;

const makeEntry = (overrides: EntryOverrides) =>
    ({
        name: 'https://network.learncard.com/trpc/some.procedure',
        duration: 400,
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

const makeFakeObserverCtor = (supportedTypes: string[] = ['fetch', 'xmlhttprequest']) => {
    // Must be a real function expression — it is invoked with `new`.
    const Fake = function (this: unknown, callback: ObserverCallback) {
        const instance: FakeObserverInstance = {
            observeTypes: [],
            disconnected: false,
            observe: vi.fn(({ type }: { type: string }) => {
                if (!supportedTypes.includes(type)) {
                    throw new Error(`unsupported type ${type}`);
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

    it('observes fetch and xmlhttprequest entry types without buffering history', () => {
        const Fake = makeFakeObserverCtor();
        const observer = observeConnectionQuality(
            makeOptions({ PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver })
        );

        expect(Fake.instances).toHaveLength(1);
        expect(Fake.instances[0].observeTypes).toEqual(['fetch', 'xmlhttprequest']);
        expect(Fake.instances[0].observe).toHaveBeenCalledWith({ type: 'fetch', buffered: false });
        observer?.disconnect();
    });

    it('reports completed first-party requests as healthy samples with duration', () => {
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

    it('keeps working when the engine throws for an unsupported observe type', () => {
        const onSample = vi.fn();
        const Fake = makeFakeObserverCtor(['fetch']); // xmlhttprequest unsupported
        const observer = observeConnectionQuality(
            makeOptions({
                onSample,
                PerformanceObserverCtor: Fake as unknown as typeof PerformanceObserver,
            })
        );

        expect(Fake.instances[0].observeTypes).toEqual(['fetch']);

        emit(Fake, [makeEntry({})]);
        expect(onSample).toHaveBeenCalledTimes(1);
        observer?.disconnect();
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
