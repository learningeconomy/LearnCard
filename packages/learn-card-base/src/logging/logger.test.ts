import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    logger,
    configureSentryTransport,
    configureLoggerContext,
    useLogger,
    type SentryTransport,
} from './logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockTransport(): SentryTransport & {
    calls: { method: string; args: unknown[] }[];
} {
    const calls: { method: string; args: unknown[] }[] = [];
    return {
        calls,
        captureException: (...args) => calls.push({ method: 'captureException', args }),
        captureMessage: (...args) => calls.push({ method: 'captureMessage', args }),
        addBreadcrumb: (...args) => calls.push({ method: 'addBreadcrumb', args }),
        withScope: (...args) => calls.push({ method: 'withScope', args }),
    };
}

// ---------------------------------------------------------------------------
// Reset module state between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
    configureSentryTransport(null);
    // Pass null (not undefined) to actually clear tenantId between tests
    configureLoggerContext({ bugReportsEnabled: true, tenantId: null });
    vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// PII scrubbing
// ---------------------------------------------------------------------------

describe('PII scrubbing', () => {
    it('scrubs known PII field names', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        logger.error('test error', new Error('boom'), {
            email: 'user@example.com',
            phone: '555-1234',
            name: 'Alice',
            did: 'did:key:abc',
            seed: 'supersecret',
            privateKey: 'pk-abc',
            accessToken: 'tok-xyz',
            idToken: 'id-tok',
            safeField: 'visible',
        });

        const call = transport.calls.find(c => c.method === 'captureException');
        expect(call).toBeDefined();
        const extra = call!.args[2] as Record<string, unknown>;
        expect(extra.email).toBe('[scrubbed]');
        expect(extra.phone).toBe('[scrubbed]');
        expect(extra.name).toBe('[scrubbed]');
        expect(extra.did).toBe('[scrubbed]');
        expect(extra.seed).toBe('[scrubbed]');
        expect(extra.privateKey).toBe('[scrubbed]');
        expect(extra.accessToken).toBe('[scrubbed]');
        expect(extra.idToken).toBe('[scrubbed]');
        expect(extra.safeField).toBe('visible');
    });

    it('scrubs bearer token strings in values', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        logger.warn('bearer test', { authHeader: 'Bearer eyJhbGci...' });

        const call = transport.calls.find(c => c.method === 'captureMessage');
        const extra = call!.args[3] as Record<string, unknown>;
        expect(extra.authHeader).toBe('[scrubbed]');
    });

    it('passes through all fields when allowPii is true', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        logger.warn('pii allowed', { email: 'user@example.com', allowPii: true });

        const call = transport.calls.find(c => c.method === 'captureMessage');
        const extra = call!.args[3] as Record<string, unknown>;
        expect(extra.email).toBe('user@example.com');
        expect('allowPii' in extra).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Privacy gate
// ---------------------------------------------------------------------------

describe('privacy gate', () => {
    it('suppresses Sentry transport when bugReportsEnabled is false', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);
        configureLoggerContext({ bugReportsEnabled: false });

        logger.error('should not reach sentry', new Error('boom'));

        expect(transport.calls).toHaveLength(0);
    });

    it('still logs to console when bugReportsEnabled is false', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);
        configureLoggerContext({ bugReportsEnabled: false });

        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('still console', new Error('boom'));

        expect(spy).toHaveBeenCalledOnce();
        expect(transport.calls).toHaveLength(0);
    });

    it('re-enables Sentry when bugReportsEnabled flips back to true', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);
        configureLoggerContext({ bugReportsEnabled: false });
        configureLoggerContext({ bugReportsEnabled: true });

        vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('back on', new Error('boom'));

        expect(transport.calls).toHaveLength(1);
    });
});

// ---------------------------------------------------------------------------
// Scope prefixing
// ---------------------------------------------------------------------------

describe('scope prefixing', () => {
    it('useLogger prefixes console output with [scope]', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const log = useLogger('wallet/claim');
        log.warn('something happened');

        expect(spy).toHaveBeenCalledWith('[wallet/claim]', 'something happened', {});
    });

    it('attaches scope tag to Sentry events', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        const log = useLogger('credential/issue');
        vi.spyOn(console, 'error').mockImplementation(() => {});
        log.error('failed');

        const call = transport.calls.find(c => c.method === 'captureMessage');
        expect(call!.args[2]).toMatchObject({ scope: 'credential/issue' });
    });

    it('attaches tenantId tag when configured', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);
        configureLoggerContext({ tenantId: 'acme' });

        vi.spyOn(console, 'warn').mockImplementation(() => {});
        logger.warn('test');

        const call = transport.calls.find(c => c.method === 'captureMessage');
        expect(call!.args[2]).toMatchObject({ tenantId: 'acme' });
    });

    it('clears tenantId when passed null', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);
        configureLoggerContext({ tenantId: 'acme' });
        configureLoggerContext({ tenantId: null });

        vi.spyOn(console, 'warn').mockImplementation(() => {});
        logger.warn('test');

        const call = transport.calls.find(c => c.method === 'captureMessage');
        expect((call!.args[2] as Record<string, string>).tenantId).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Primitives and arrays
// ---------------------------------------------------------------------------

describe('primitives and arrays', () => {
    it('logs a boolean directly to console', () => {
        const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
        const log = useLogger('feature');
        log.info('isEnabled::', false);

        expect(spy).toHaveBeenCalledWith('[feature]', 'isEnabled::', false);
    });

    it('logs a number directly to console', () => {
        const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
        const log = useLogger('feature');
        log.info('count::', 42);

        expect(spy).toHaveBeenCalledWith('[feature]', 'count::', 42);
    });

    it('logs a string directly to console (not wrapped as Error)', () => {
        const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
        const log = useLogger('feature');
        log.info('status::', 'active');

        expect(spy).toHaveBeenCalledWith('[feature]', 'status::', 'active');
    });

    it('logs an array directly to console', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const log = useLogger('feature');
        log.warn('items::', [1, 2, 3]);

        expect(spy).toHaveBeenCalledWith('[feature]', 'items::', [1, 2, 3]);
    });

    it('sends primitive as { value } in Sentry breadcrumb (info)', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        logger.info('flag::', true);

        expect(transport.calls[0].method).toBe('addBreadcrumb');
        const data = (transport.calls[0].args[0] as { data: Record<string, unknown> }).data;
        expect(data.value).toBe(true);
    });

    it('sends primitive as { value } in Sentry captureMessage (warn)', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        vi.spyOn(console, 'warn').mockImplementation(() => {});
        logger.warn('flag::', false);

        const call = transport.calls.find(c => c.method === 'captureMessage');
        expect((call!.args[3] as Record<string, unknown>).value).toBe(false);
    });

    it('sends primitive as { value } in Sentry captureMessage (error, no Error object)', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('count::', 99);

        const call = transport.calls.find(c => c.method === 'captureMessage');
        expect((call!.args[3] as Record<string, unknown>).value).toBe(99);
    });
});

// ---------------------------------------------------------------------------
// Dev-vs-prod transport selection
// ---------------------------------------------------------------------------

describe('dev vs prod transport', () => {
    it('debug is dropped when Sentry transport is active', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
        logger.debug('verbose detail');

        expect(spy).not.toHaveBeenCalled();
        expect(transport.calls).toHaveLength(0);
    });

    it('debug reaches console when no transport is registered', () => {
        const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
        logger.debug('dev debug');

        expect(spy).toHaveBeenCalledOnce();
    });

    it('info becomes a Sentry breadcrumb in prod', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        logger.info('user navigated', { page: 'home' });

        expect(transport.calls[0].method).toBe('addBreadcrumb');
        expect((transport.calls[0].args[0] as { message: string }).message).toBe('user navigated');
    });

    it('info reaches console in dev (no transport)', () => {
        const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
        logger.info('dev info');

        expect(spy).toHaveBeenCalledOnce();
    });

    it('warn captures Sentry message and logs to console in prod', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        logger.warn('slow request', { ms: 500 });

        expect(spy).toHaveBeenCalledOnce();
        const sentryCall = transport.calls.find(c => c.method === 'captureMessage');
        expect(sentryCall).toBeDefined();
        expect(sentryCall!.args[1]).toBe('warning');
    });

    it('error with Error calls captureException', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        const err = new Error('oops');
        vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('exploded', err);

        const call = transport.calls.find(c => c.method === 'captureException');
        expect(call).toBeDefined();
        expect(call!.args[0]).toBe(err);
    });

    it('error without Error object calls captureMessage', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('string error only');

        const call = transport.calls.find(c => c.method === 'captureMessage');
        expect(call).toBeDefined();
        expect(call!.args[1]).toBe('error');
    });
});
