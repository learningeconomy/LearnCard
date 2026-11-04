import { describe, expect, mock, test } from 'bun:test';
import { TRPCClientError } from '@trpc/client';

import { createLearnCardLoader } from './index';
import {
    classifyLearnCardFailure,
    isTransientLearnCardFailure,
    LearnCardUnavailableError,
} from './errors';
import { runWithLearnCardRequestScope } from './requestScope';

// Never touches a real LearnCard endpoint: every initializer here is a fake.

const unauthorized = () =>
    TRPCClientError.from({
        error: {
            message: 'synthetic-private-payload',
            code: -32001,
            data: {
                code: 'UNAUTHORIZED',
                httpStatus: 401,
                path: 'profile.getProfile',
            },
        },
    });

describe('createLearnCardLoader', () => {
    test('warm() starts the shared init that the first caller then joins', async () => {
        const gate = Promise.withResolvers<{ id: string }>();
        const initialize = mock(() => gate.promise);
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 5_000,
            failureBackoffMs: 1_000,
        });

        const warmed = getLearnCard.warm();
        const first = getLearnCard();
        expect(await getLearnCard.warm()).toBe('skipped');
        gate.resolve({ id: 'instance' });

        expect(await warmed).toBe('ready');
        expect(await first).toEqual({ id: 'instance' });
        expect(initialize).toHaveBeenCalledTimes(1);
    });

    test("a failed warm-up resolves and isn't cached, so the first caller inits fresh", async () => {
        let calls = 0;
        const initialize = mock(async () => {
            calls += 1;
            if (calls === 1) throw 'Key mismatch';
            return { id: 'instance' };
        });
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 5_000,
            failureBackoffMs: 60_000,
        });

        expect(await getLearnCard.warm()).toBe('failed');
        expect(await getLearnCard()).toEqual({ id: 'instance' });
        expect(initialize).toHaveBeenCalledTimes(2);
    });

    test("warm() leaves a real caller's cached failure alone", async () => {
        const initialize = mock(async () => {
            throw 'Key mismatch';
        });
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 5_000,
            failureBackoffMs: 60_000,
        });

        await expect(getLearnCard()).rejects.toBeInstanceOf(LearnCardUnavailableError);
        expect(await getLearnCard.warm()).toBe('skipped');
        await expect(getLearnCard()).rejects.toBeInstanceOf(LearnCardUnavailableError);
        expect(initialize).toHaveBeenCalledTimes(1);
    });

    test('bounds a hung init and reports it unavailable with its cause class', async () => {
        const initialize = mock(() => new Promise<never>(() => {}));
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 20,
            failureBackoffMs: 1_000,
        });
        const startedAt = performance.now();
        const error = await getLearnCard().catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(LearnCardUnavailableError);
        expect((error as LearnCardUnavailableError).detail).toEqual({
            errorClass: 'TimeoutError',
            causeKind: 'other',
            initAttempts: 1,
        });
        expect(performance.now() - startedAt).toBeLessThan(500);
    });

    test("a caller's abort releases only that caller, not the shared init", async () => {
        const gate = Promise.withResolvers<{ id: string }>();
        const initialize = mock(() => gate.promise);
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 5_000,
            failureBackoffMs: 1_000,
        });
        const controller = new AbortController();
        const deadline = new DOMException('deadline', 'TimeoutError');

        const aborted = getLearnCard({ signal: controller.signal });
        const patient = getLearnCard();
        controller.abort(deadline);
        await expect(aborted).rejects.toBe(deadline);

        gate.resolve({ id: 'instance' });
        expect(await patient).toEqual({ id: 'instance' });
        expect(await getLearnCard()).toEqual({ id: 'instance' });
        expect(initialize).toHaveBeenCalledTimes(1);
    });

    test("a scoped request's abort never fails the shared init for other callers", async () => {
        const gate = Promise.withResolvers<{ id: string }>();
        const initialize = mock(() => gate.promise);
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 1_000,
            failureBackoffMs: 60_000,
        });
        const request = new AbortController();

        // The first caller starts the shared init inside a request scope and passes
        // no signal of its own, so it waits on the scope's signal.
        const first = runWithLearnCardRequestScope({ signal: request.signal }, () =>
            getLearnCard()
        ).catch((caught: unknown) => caught);
        request.abort(new DOMException('request deadline', 'TimeoutError'));
        expect(await first).toBeInstanceOf(DOMException);

        // A caller from another request still joins the same init.
        const second = getLearnCard();
        gate.resolve({ id: 'healthy' });
        expect(await second).toEqual({ id: 'healthy' });
        // Nothing was cached as a failure, and init ran once.
        expect(await getLearnCard()).toEqual({ id: 'healthy' });
        expect(initialize).toHaveBeenCalledTimes(1);
    });

    test('does not retry a misconfigured service identity, even for a consent gate', async () => {
        let now = 0;
        const initialize = mock(async () => {
            throw 'Key mismatch';
        });
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 1_000,
            failureBackoffMs: 5_000,
            retryDelayMs: 0,
            now: () => now,
        });

        const first = await getLearnCard().catch((caught: unknown) => caught);
        expect(first).toBeInstanceOf(LearnCardUnavailableError);
        expect((first as LearnCardUnavailableError).detail).toEqual({
            errorClass: 'unknown',
            causeKind: 'key_mismatch',
            initAttempts: 1,
        });
        expect(initialize).toHaveBeenCalledTimes(1);

        now = 1;
        await expect(getLearnCard({ retryTransientFailure: true })).rejects.toBe(first as Error);
        expect(initialize).toHaveBeenCalledTimes(1);
    });

    test('still retries a did.json fetch blip once', async () => {
        const initialize = mock(async () => ({ id: 'instance' }));
        initialize.mockImplementationOnce(async () => {
            throw 'Error sending HTTP request (https://example.test/did.json)';
        });
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 1_000,
            failureBackoffMs: 5_000,
            retryDelayMs: 0,
        });
        expect(await getLearnCard()).toEqual({ id: 'instance' });
        expect(initialize).toHaveBeenCalledTimes(2);
    });

    test('backs off after an init failure instead of re-initializing on every call', async () => {
        let now = 0;
        const initialize = mock(async () => ({ id: 'instance' }));
        initialize.mockImplementationOnce(async () => {
            throw unauthorized();
        });
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 1_000,
            failureBackoffMs: 5_000,
            now: () => now,
        });

        const first = await getLearnCard().catch((caught: unknown) => caught);
        expect(first).toBeInstanceOf(LearnCardUnavailableError);
        expect(classifyLearnCardFailure(first)).toBe('learncard_unauthorized');
        expect((first as LearnCardUnavailableError).detail).toEqual({
            errorClass: 'TRPCClientError',
            trpcCode: 'UNAUTHORIZED',
            httpStatus: 401,
            causeKind: 'other',
            initAttempts: 1,
        });
        expect(JSON.stringify(first)).not.toContain('synthetic-private');

        now = 4_999;
        await expect(getLearnCard()).rejects.toBe(first as Error);
        await expect(getLearnCard()).rejects.toBe(first as Error);
        expect(initialize).toHaveBeenCalledTimes(1);

        now = 5_000;
        expect(await getLearnCard()).toEqual({ id: 'instance' });
        expect(initialize).toHaveBeenCalledTimes(2);
    });

    // DIDKit throws a bare string when it cannot fetch the service's did:web
    // document, e.g. "Error sending HTTP request (https://…/did.json)". That is
    // what v189 logged as learncard_unavailable with learncardErrorClass unknown.
    const didWebBlip = () =>
        'Error sending HTTP request (https://synthetic.invalid/.well-known/did.json)';

    test('retries a did:web blip so the opening and the plan both get the service LearnCard', async () => {
        const initialize = mock(async () => ({ id: 'instance' }));
        initialize.mockImplementationOnce(async () => {
            throw didWebBlip();
        });
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 1_000,
            failureBackoffMs: 60_000,
            retryDelayMs: 1,
        });

        // The opening's consent read and the plan's consent check, back to back.
        const opening = getLearnCard();
        const plan = getLearnCard();
        expect(await opening).toEqual({ id: 'instance' });
        expect(await plan).toEqual({ id: 'instance' });
        expect(await getLearnCard()).toEqual({ id: 'instance' });
        expect(initialize).toHaveBeenCalledTimes(2);
    });

    test('a persistent did:web failure still fails closed as learncard_unavailable and backs off', async () => {
        let now = 0;
        const initialize = mock(async (): Promise<{ id: string }> => {
            throw didWebBlip();
        });
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 1_000,
            failureBackoffMs: 5_000,
            retryDelayMs: 1,
            now: () => now,
        });

        const error = await getLearnCard().catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(LearnCardUnavailableError);
        expect(classifyLearnCardFailure(error)).toBe('learncard_unavailable');
        // Not an identity misconfiguration, after both attempts.
        expect((error as LearnCardUnavailableError).detail).toEqual({
            errorClass: 'unknown',
            causeKind: 'other',
            initAttempts: 2,
        });
        expect(JSON.stringify(error)).not.toContain('synthetic.invalid');
        expect(initialize).toHaveBeenCalledTimes(2);

        now = 1;
        await expect(getLearnCard()).rejects.toBe(error as Error);
        expect(initialize).toHaveBeenCalledTimes(2);
    });

    test('never retries a rejected service identity', async () => {
        const initialize = mock(async (): Promise<{ id: string }> => {
            throw unauthorized();
        });
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 1_000,
            failureBackoffMs: 5_000,
            retryDelayMs: 1,
        });
        const error = await getLearnCard().catch((caught: unknown) => caught);
        expect(classifyLearnCardFailure(error)).toBe('learncard_unauthorized');
        expect(initialize).toHaveBeenCalledTimes(1);
    });

    test('the retry stays inside the init timeout', async () => {
        const initialize = mock(async (): Promise<{ id: string }> => {
            await Bun.sleep(15);
            throw didWebBlip();
        });
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 20,
            failureBackoffMs: 5_000,
            retryDelayMs: 1,
        });
        const error = await getLearnCard().catch((caught: unknown) => caught);
        expect((error as LearnCardUnavailableError).detail).toEqual({
            errorClass: 'TimeoutError',
            causeKind: 'other',
            initAttempts: 2,
        });
    });

    // v190: the opening's consent read failed transiently (both attempts), the
    // failure was cached for the 5 s backoff, and the plan's consent check
    // ~180 ms later got that cached failure and killed the Math start.
    test('a consent gate retries a cached transient init failure instead of failing the start', async () => {
        let now = 0;
        const initialize = mock(async () => ({ id: 'instance' }));
        initialize.mockImplementationOnce(async () => {
            throw didWebBlip();
        });
        initialize.mockImplementationOnce(async () => {
            throw didWebBlip();
        });
        const getLearnCard = createLearnCardLoader(initialize, {
            initTimeoutMs: 1_000,
            failureBackoffMs: 5_000,
            retryDelayMs: 1,
            now: () => now,
        });

        const opening = await getLearnCard().catch((caught: unknown) => caught);
        expect(classifyLearnCardFailure(opening)).toBe('learncard_unavailable');
        expect(initialize).toHaveBeenCalledTimes(2);

        now = 180;
        // A plain caller still honours the backoff.
        await expect(getLearnCard()).rejects.toBe(opening as Error);
        expect(initialize).toHaveBeenCalledTimes(2);
        // The plan's consent gate starts one fresh shared init instead.
        expect(await getLearnCard({ retryTransientFailure: true })).toEqual({
            id: 'instance',
        });
        expect(await getLearnCard()).toEqual({ id: 'instance' });
        expect(initialize).toHaveBeenCalledTimes(3);
    });

    test('a consent gate does not retry a cached identity rejection or timeout', async () => {
        let now = 0;
        const rejected = mock(async (): Promise<{ id: string }> => {
            throw unauthorized();
        });
        const getRejected = createLearnCardLoader(rejected, {
            initTimeoutMs: 1_000,
            failureBackoffMs: 5_000,
            now: () => now,
        });
        const rejection = await getRejected().catch((caught: unknown) => caught);
        now = 1;
        await expect(getRejected({ retryTransientFailure: true })).rejects.toBe(rejection as Error);
        expect(rejected).toHaveBeenCalledTimes(1);

        const hung = mock(() => new Promise<{ id: string }>(() => {}));
        const getHung = createLearnCardLoader(hung, {
            initTimeoutMs: 20,
            failureBackoffMs: 5_000,
            now: () => now,
        });
        const timeout = await getHung().catch((caught: unknown) => caught);
        await expect(getHung({ retryTransientFailure: true })).rejects.toBe(timeout as Error);
        expect(hung).toHaveBeenCalledTimes(1);
    });
});

describe('isTransientLearnCardFailure', () => {
    test('network and 5xx failures are transient; identity, missing profile and bad requests are not', () => {
        expect(isTransientLearnCardFailure({ errorClass: 'unknown' })).toBe(true);
        expect(
            isTransientLearnCardFailure({ errorClass: 'TypeError', causeErrno: 'ECONNRESET' })
        ).toBe(true);
        expect(isTransientLearnCardFailure({ trpcCode: 'BAD_GATEWAY', httpStatus: 502 })).toBe(
            true
        );
        expect(isTransientLearnCardFailure({ trpcCode: 'UNAUTHORIZED', httpStatus: 401 })).toBe(
            false
        );
        expect(isTransientLearnCardFailure({ trpcCode: 'NOT_FOUND', httpStatus: 404 })).toBe(false);
        expect(isTransientLearnCardFailure({ trpcCode: 'BAD_REQUEST', httpStatus: 400 })).toBe(
            false
        );
    });
});
