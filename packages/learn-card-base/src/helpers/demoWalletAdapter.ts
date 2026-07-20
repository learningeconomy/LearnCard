import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { LCR } from 'learn-card-base/types/credential-records';
import {
    DEMO_URI_PREFIX,
    getDemoBoost,
    getDemoBoostChildren,
    getDemoRecordsForCategory,
    getDemoVC,
    isDemoSessionActive,
} from 'learn-card-base/stores/demoSessionStore';

/**
 * Thrown when a write operation is attempted while Sample Wallet (demo) mode
 * is active. UI should map this to a "preview-only" message rather than a
 * generic error.
 */
export class DemoModeError extends Error {
    constructor(operation: string) {
        super(`"${operation}" is not available while exploring a Sample Wallet`);
        this.name = 'DemoModeError';
    }
}

export const isDemoModeError = (error: unknown): error is DemoModeError =>
    error instanceof Error && error.name === 'DemoModeError';

const INDEX_WRITE_METHODS = new Set(['add', 'addMany', 'update', 'remove', 'removeAll']);
const STORE_WRITE_METHODS = new Set(['upload', 'uploadMany', 'uploadEncrypted', 'delete']);

const BLOCKED_INVOKE_METHODS = new Set([
    'issueCredential',
    'issuePresentation',
    'sendBoost',
    'sendCredential',
    'sendPresentation',
    'acceptCredential',
    'acceptPresentation',
    'deleteCredential',
    'deletePresentation',
    'consentToContract',
    'withdrawConsent',
    'updateContractTerms',
    'syncCredentialsToContract',
    'createBoost',
    'updateBoost',
    'deleteBoost',
]);

type DemoIndexQuery =
    | { category?: unknown; uri?: unknown; id?: unknown; boostUri?: unknown }
    | undefined;

const matchesField = (recordValue: string | undefined, queryValue: unknown): boolean => {
    if (queryValue === undefined) return true;
    if (typeof queryValue === 'string') return recordValue === queryValue;

    if (queryValue && typeof queryValue === 'object') {
        const inValues = (queryValue as { $in?: unknown[] }).$in;
        if (Array.isArray(inValues)) return inValues.includes(recordValue);
    }

    return false;
};

const filterDemoRecords = (query: DemoIndexQuery): LCR[] =>
    getDemoRecordsForCategory().filter(
        record =>
            matchesField(record.category, query?.category) &&
            matchesField(record.uri, query?.uri) &&
            matchesField(record.id, query?.id) &&
            matchesField((record as { boostUri?: string }).boostUri, query?.boostUri)
    );

const blockWhenDemoActive = (
    original: (...args: unknown[]) => unknown,
    target: object,
    operation: string
) => {
    return (...args: unknown[]): unknown => {
        if (isDemoSessionActive()) return Promise.reject(new DemoModeError(operation));

        return original.apply(target, args);
    };
};

const wrapIndexProvider = <T extends object>(provider: T): T =>
    new Proxy(provider, {
        get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);

            if (typeof original !== 'function' || typeof prop !== 'string') return original;

            if (INDEX_WRITE_METHODS.has(prop)) {
                return blockWhenDemoActive(original, target, `index.${prop}`);
            }

            if (prop === 'get') {
                return async (query?: DemoIndexQuery, ...rest: unknown[]) =>
                    isDemoSessionActive()
                        ? filterDemoRecords(query)
                        : original.apply(target, [query, ...rest]);
            }

            if (prop === 'getPage') {
                return async (query?: DemoIndexQuery, ...rest: unknown[]) =>
                    isDemoSessionActive()
                        ? {
                              records: filterDemoRecords(query),
                              hasMore: false,
                              cursor: undefined as undefined | string,
                          }
                        : original.apply(target, [query, ...rest]);
            }

            if (prop === 'getCount') {
                return async (query?: DemoIndexQuery, ...rest: unknown[]) =>
                    isDemoSessionActive()
                        ? filterDemoRecords(query).length
                        : original.apply(target, [query, ...rest]);
            }

            return original.bind(target);
        },
    });

const wrapStoreProvider = <T extends object>(provider: T): T =>
    new Proxy(provider, {
        get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);

            if (typeof original !== 'function' || typeof prop !== 'string') return original;

            if (STORE_WRITE_METHODS.has(prop)) {
                return blockWhenDemoActive(original, target, `store.${prop}`);
            }

            return original.bind(target);
        },
    });

const wrapPlaneProviders = <T extends object>(
    plane: T,
    wrapProvider: (provider: object) => object
): T =>
    new Proxy(plane, {
        get(target, prop, receiver) {
            const provider = Reflect.get(target, prop, receiver);

            if (provider && typeof provider === 'object') return wrapProvider(provider);

            return provider;
        },
    });

const wrapReadPlane = <T extends object>(read: T): T =>
    new Proxy(read, {
        get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);

            if (prop === 'get' && typeof original === 'function') {
                return async (uri?: string, ...rest: unknown[]) => {
                    const demoVC = getDemoVC(uri);
                    if (demoVC) return demoVC;

                    return original.apply(target, [uri, ...rest]);
                };
            }

            return typeof original === 'function' ? original.bind(target) : original;
        },
    });

const isDemoUri = (uri: unknown): uri is string =>
    typeof uri === 'string' && uri.startsWith(DEMO_URI_PREFIX);

const wrapInvoke = <T extends object>(invoke: T): T =>
    new Proxy(invoke, {
        get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);

            if (typeof original !== 'function') return original;

            if (typeof prop === 'string' && BLOCKED_INVOKE_METHODS.has(prop)) {
                return blockWhenDemoActive(original, target, `invoke.${prop}`);
            }

            if (prop === 'getBoost') {
                return async (uri?: unknown, ...rest: unknown[]) =>
                    isDemoUri(uri) ? getDemoBoost(uri) : original.apply(target, [uri, ...rest]);
            }

            if (prop === 'getBoostChildren') {
                return async (uri?: unknown, ...rest: unknown[]) =>
                    isDemoUri(uri)
                        ? {
                              records: getDemoBoostChildren(uri),
                              hasMore: false,
                              cursor: undefined as undefined | string,
                          }
                        : original.apply(target, [uri, ...rest]);
            }

            return original.bind(target);
        },
    });

/**
 * Wraps a wallet so that, while Sample Wallet (demo) mode is active:
 * - index reads are served from the local demo session store
 * - `read.get` resolves `lc:demo:` URIs from the demo store
 * - all index/store writes and mutating invoke methods reject with DemoModeError
 *
 * When demo mode is inactive every call passes through untouched, so it is
 * safe to wrap unconditionally at wallet construction time and cache the
 * wrapped instance.
 */
export const wrapWalletForDemo = (wallet: BespokeLearnCard): BespokeLearnCard =>
    new Proxy(wallet, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);

            if (!value || typeof value !== 'object') return value;

            if (prop === 'index') return wrapPlaneProviders(value, wrapIndexProvider);
            if (prop === 'store') return wrapPlaneProviders(value, wrapStoreProvider);
            if (prop === 'read') return wrapReadPlane(value);
            if (prop === 'invoke') return wrapInvoke(value);

            return value;
        },
    });
