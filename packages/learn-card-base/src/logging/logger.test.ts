import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import {
    logger,
    configureSentryTransport,
    configureLoggerContext,
    getLogger,
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

afterAll(() => {
    configureSentryTransport(null);
    configureLoggerContext({ bugReportsEnabled: true, tenantId: null });
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

    it('scrubs PII nested inside an object', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('lookup failed', { user: { email: 'user@example.com', code: 404 } });

        const call = transport.calls.find(c => c.method === 'captureMessage');
        const extra = call!.args[3] as Record<string, { email: unknown; code: unknown }>;
        expect(extra.user.email).toBe('[scrubbed]');
        expect(extra.user.code).toBe(404);
    });

    it('scrubs PII nested inside an array of objects', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('batch failed', { items: [{ accessToken: 'tok-1' }, { accessToken: 'tok-2' }] });

        const call = transport.calls.find(c => c.method === 'captureMessage');
        const extra = call!.args[3] as Record<string, { accessToken: unknown }[]>;
        expect(extra.items[0].accessToken).toBe('[scrubbed]');
        expect(extra.items[1].accessToken).toBe('[scrubbed]');
    });

    it('scrubs PII variant key names (userEmail, phoneNumber, firstName)', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('variant keys', { userEmail: 'a@b.com', phoneNumber: '555', firstName: 'Bob', code: 1 });

        const call = transport.calls.find(c => c.method === 'captureMessage');
        const extra = call!.args[3] as Record<string, unknown>;
        expect(extra.userEmail).toBe('[scrubbed]');
        expect(extra.phoneNumber).toBe('[scrubbed]');
        expect(extra.firstName).toBe('[scrubbed]');
        expect(extra.code).toBe(1);
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
    it('getLogger prefixes console output with [scope]', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const log = getLogger('wallet/claim');
        log.warn('something happened');

        expect(spy).toHaveBeenCalledWith('[wallet/claim]', 'something happened', {});
    });

    it('attaches scope tag to Sentry events', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        const log = getLogger('credential/issue');
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
        const log = getLogger('feature');
        log.info('isEnabled::', false);

        expect(spy).toHaveBeenCalledWith('[feature]', 'isEnabled::', false);
    });

    it('logs a number directly to console', () => {
        const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
        const log = getLogger('feature');
        log.info('count::', 42);

        expect(spy).toHaveBeenCalledWith('[feature]', 'count::', 42);
    });

    it('logs a string directly to console (not wrapped as Error)', () => {
        const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
        const log = getLogger('feature');
        log.info('status::', 'active');

        expect(spy).toHaveBeenCalledWith('[feature]', 'status::', 'active');
    });

    it('logs an array directly to console', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const log = getLogger('feature');
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
    it('debug reaches console in non-production even when Sentry transport is active', () => {
        // NODE_ENV is 'test' in Vitest, not 'production', so debug is not dropped.
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
        logger.debug('verbose detail');

        expect(spy).toHaveBeenCalledOnce();
        expect(transport.calls).toHaveLength(0); // debug never goes to Sentry
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

// ---------------------------------------------------------------------------
// Error as first argument
// ---------------------------------------------------------------------------

describe('flexible arguments (like console.log)', () => {
    it('log.error(error) uses error.message as the message', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const err = new Error('something broke');

        logger.error(err);

        expect(spy).toHaveBeenCalledWith('', 'something broke', err, {});
    });

    it('log.error(error) calls captureException with the error', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        const err = new Error('exploded');
        vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error(err);

        const call = transport.calls.find(c => c.method === 'captureException');
        expect(call).toBeDefined();
        expect(call!.args[0]).toBe(err);
    });

    it('log.error(error, meta) forwards meta as extra to Sentry', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        const err = new Error('boom');
        vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error(err, { userId: '123' });

        const call = transport.calls.find(c => c.method === 'captureException');
        expect(call).toBeDefined();
        expect(call!.args[2]).toMatchObject({ userId: '123' });
    });

    it('log.error(message) works with just a message string', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('just a message');

        expect(spy).toHaveBeenCalledWith('', 'just a message', {});
    });

    it('log.error(primitive) logs a primitive value without a message', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error(42);

        expect(spy).toHaveBeenCalledWith('', 42);
    });

    it('log.error(array) logs an array without a message', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const arr = [1, 2, 3];
        logger.error(arr);

        expect(spy).toHaveBeenCalledWith('', arr);
    });

    it('log.error(object) logs an object as metadata without explicit message', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const obj = { userId: '123' };
        logger.error(obj);

        expect(spy).toHaveBeenCalledWith('', obj);
    });

    it('log.error(message, primitive) outputs both message and primitive', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('count:', 42);

        expect(spy).toHaveBeenCalledWith('', 'count:', 42);
    });

    it('log.error(message, array) outputs message and array', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const arr = [1, 2, 3];
        logger.error('items:', arr);

        expect(spy).toHaveBeenCalledWith('', 'items:', arr);
    });

    it('log.error(error, primitive) outputs error and primitive', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const err = new Error('failed');
        logger.error(err, 42);

        expect(spy).toHaveBeenCalledWith('', 'failed', err, {});
    });

    it('log.info(error) uses error.message and creates breadcrumb', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        const err = new Error('warning: low disk space');
        logger.info(err);

        const call = transport.calls.find(c => c.method === 'addBreadcrumb');
        expect(call).toBeDefined();
        expect((call!.args[0] as { message: string }).message).toBe('warning: low disk space');
        expect((call!.args[0] as { data?: { error?: string } }).data?.error).toBe('Error: warning: low disk space');
    });

    it('log.warn(error) uses error.message for captureMessage', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        const err = new Error('deprecated API used');
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        logger.warn(err);

        const call = transport.calls.find(c => c.method === 'captureMessage');
        expect(call).toBeDefined();
        expect(call!.args[0]).toBe('deprecated API used');
        expect(call!.args[1]).toBe('warning');
    });

    it('log.debug(error) uses error.message', () => {
        const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
        const err = new Error('internal state: x=5');

        logger.debug(err);

        expect(spy).toHaveBeenCalledWith('', 'internal state: x=5', err, {});
    });

    it('getLogger(scope).error(error) includes scope prefix', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const log = getLogger('wallet');
        const err = new Error('load failed');

        log.error(err);

        expect(spy).toHaveBeenCalledWith('[wallet]', 'load failed', err, {});
    });

    it('getLogger(scope).error(primitive) includes scope prefix even without message', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const log = getLogger('wallet');
        log.error(99);

        expect(spy).toHaveBeenCalledWith('[wallet]', 99);
    });

    it('getLogger(scope).error(error) includes scope in Sentry tags', () => {
        const transport = makeMockTransport();
        configureSentryTransport(transport);

        const log = getLogger('auth');
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const err = new Error('auth failure');
        log.error(err);

        const call = transport.calls.find(c => c.method === 'captureException');
        expect(call!.args[1]).toMatchObject({ scope: 'auth' });
    });
});
