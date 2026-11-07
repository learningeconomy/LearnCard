mock.module('./runs', () => ({
    listRuns: async () => [],
    diagnoseMetadata: async () => ({ scanned: 2, excluded: 1 }),
    getPlanStatus: async () => ({ state: 'preparing', processed: 1, total: 2 }),
    planRun: async (...args: any[]) => {
        calls += 1;
        planArguments = args;
        return {};
    },
    startRun: async (...args: any[]) => {
        calls += 1;
        runArguments = args;
        return {};
    },
    stopRun: async (...args: any[]) => {
        calls += 1;
        runArguments = args;
        return {};
    },
    recoverRunOnce: async (...args: any[]) => {
        calls += 1;
        runArguments = args;
        return {};
    },
    resumeRun: async (...args: any[]) => {
        calls += 1;
        runArguments = args;
        if (resumeFailure) throw resumeFailure;
        return {};
    },
}));
let currentSession: { did: string; authenticatedAt: number } | null = null;
let runArguments: any[] = [];
let resumeFailure: Error | undefined;
let planArguments: any[] = [];
mock.module('../auth/service', () => ({
    authService: { getSession: async () => currentSession },
}));
mock.module('./batches', () => ({
    listBatches: async () => [],
    recoverBatch: async () => {
        calls += 1;
        return {};
    },
    batchPreflight: async () => ({}),
    assertNoBatch: async () => {},
    startBatch: async () => {
        calls += 1;
        return {};
    },
    advanceBatch: async () => {
        calls += 1;
        return {};
    },
    stopBatch: async () => {
        calls += 1;
        return {};
    },
}));
import { expect, mock, test } from 'bun:test';
mock.module('./legacy-repair', () => ({
    listRepairJobs: async () => [],
    createRepairJob: async () => {
        calls += 1;
        return {};
    },
    repairJobAction: async () => {
        calls += 1;
        return {};
    },
}));
let coverageError: unknown;
mock.module('./coverage', () => ({
    migrationCoverage: async () => {
        if (coverageError) throw coverageError;
        return {
            novaReady: 1,
            openaiOnly: 2,
            unresolved: 0,
        };
    },
}));
mock.module('../ai/read-generation', () => ({
    readGenerationStatus: async () => ({
        effective: 'openai1536',
        control: 'deployment',
        configured: 'openai1536',
        degraded: false,
        reason: 'deployment_configuration',
    }),
}));
const configured = 'did:web:passport.example.test';
mock.module('../constants/env', () => ({
    LEARNCARD_DID_WEB: configured,
    DOMAIN: 'https://passport.example.test',
    CORS_ORIGINS: ['https://ai.learncard.test'],
}));
let actual = configured,
    calls = 0;
mock.module('../learncard', () => ({
    getLearnCard: async () => ({ id: { did: () => actual } }),
}));
mock.module('./backfill', () => ({
    listJobs: async () => [],
    createJob: async () => {
        calls += 1;
        return {};
    },
    stepJob: async () => {
        calls += 1;
        return {};
    },
    cancelJob: async () => {
        calls += 1;
    },
    costPlan: () => ({}),
}));
mock.module('../db', () => ({
    db: {
        sourceCleanupSummary: async () => ({ pendingTasks: 0, pendingPoints: 0 }),
    },
}));
mock.module('../db/qdrant', () => ({
    recoverSourceVectorCleanup: async () => {
        calls += 1;
        return { pendingTasks: 0, pendingPoints: 0 };
    },
}));
const { handleAdminRoute } = await import('./routes');
const { csrfToken } = await import('./security');
const session = { did: configured, authenticatedAt: Date.now() },
    id = 'opaque-session';
const origin = 'https://passport.example.test';
const req = (path: string, override: Record<string, string> = {}) =>
    new Request(`${origin}${path}`, {
        method: 'POST',
        headers: {
            Origin: origin,
            'Content-Type': 'application/json',
            'X-Passport-CSRF': csrfToken(id, origin),
            ...override,
        },
        body: JSON.stringify({
            dryRun: true,
            requestId: '11111111-1111-4111-8111-111111111111',
        }),
    });
test('every admin mutation rejects unauthenticated, foreign, stale and CSRF proofs', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    for (const path of [
        '/admin/embeddings/runs/11111111-1111-4111-8111-111111111111/recover-once',
        '/admin/embeddings/batches',
        '/admin/embeddings/batches/11111111-1111-4111-8111-111111111111/advance',
        '/admin/embeddings/batches/11111111-1111-4111-8111-111111111111/pause',
        '/admin/embeddings/batches/11111111-1111-4111-8111-111111111111/cancel',
        '/admin/embeddings/batches/11111111-1111-4111-8111-111111111111/recover',
        '/admin/embeddings/jobs',
        '/admin/embeddings/cleanup/step',
        '/admin/embeddings/legacy-repair/jobs',
        '/admin/embeddings/legacy-repair/jobs/11111111-1111-4111-8111-111111111111/preview',
        '/admin/embeddings/legacy-repair/jobs/11111111-1111-4111-8111-111111111111/verify',
        '/admin/embeddings/jobs/11111111-1111-4111-8111-111111111111/step',
        '/admin/embeddings/jobs/11111111-1111-4111-8111-111111111111/cancel',
    ]) {
        expect((await handleAdminRoute(req(path), null, id))?.status).toBe(401);
        expect(
            (await handleAdminRoute(req(path), { ...session, did: 'did:key:manager' }, id))?.status
        ).toBe(403);
        expect(
            (await handleAdminRoute(req(path), { ...session, authenticatedAt: 1 }, id))?.status
        ).toBe(401);
        expect(
            (
                await handleAdminRoute(
                    req(path, { Origin: 'https://evil.example.test' }),
                    session,
                    id
                )
            )?.status
        ).toBe(403);
        expect(
            (await handleAdminRoute(req(path, { 'X-Passport-CSRF': 'bad' }), session, id))?.status
        ).toBe(403);
    }
    expect(calls).toBe(0);
    actual = 'did:key:fallback';
    expect((await handleAdminRoute(req('/admin/embeddings/jobs'), session, id))?.status).toBe(403);
    actual = configured;
    expect((await handleAdminRoute(req('/admin/embeddings/jobs'), session, id))?.status).toBe(201);
    expect(calls).toBe(1);
    delete process.env.EMBEDDINGS_ADMIN_ENABLED;
    expect((await handleAdminRoute(req('/admin/embeddings/jobs'), session, id))?.status).toBe(404);
});

test('bounded cleanup accepts only a unit limit under the configured profile and existing mutation proofs', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    actual = configured;
    const request = (body: object) =>
        new Request(`${origin}/admin/embeddings/cleanup/step`, {
            method: 'POST',
            headers: {
                Origin: origin,
                'Content-Type': 'application/json',
                'X-Passport-CSRF': csrfToken(id, origin),
            },
            body: JSON.stringify(body),
        });
    const before = calls;
    for (const body of [
        { limit: 0 },
        { limit: 6 },
        { limit: '1' },
        { limit: 1, did: 'did:key:arbitrary' },
    ])
        expect((await handleAdminRoute(request(body), session, id))?.status).toBe(400);
    expect(calls).toBe(before);
    expect((await handleAdminRoute(request({ limit: 1 }), session, id))?.status).toBe(200);
    expect(calls).toBe(before + 1);
    delete process.env.EMBEDDINGS_ADMIN_ENABLED;
});

test('coverage read requires the configured service identity and exact trusted origin', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    const request = (headers: Record<string, string> = { Origin: origin }) =>
        new Request(`${origin}/admin/embeddings/coverage`, { headers });
    expect((await handleAdminRoute(request(), null, id))?.status).toBe(401);
    expect(
        (await handleAdminRoute(request(), { ...session, did: 'did:key:other' }, id))?.status
    ).toBe(403);
    expect(
        (await handleAdminRoute(request({ Origin: 'https://evil.test' }), session, id))?.status
    ).toBe(403);
    actual = 'did:key:unexpected';
    expect((await handleAdminRoute(request(), session, id))?.status).toBe(403);
    actual = configured;
    const response = await handleAdminRoute(request(), session, id);
    expect(response?.status).toBe(200);
    expect(response?.headers.get('Cache-Control')).toBe('no-store');
    expect(await response?.json()).toEqual({
        novaReady: 1,
        openaiOnly: 2,
        unresolved: 0,
    });
    delete process.env.EMBEDDINGS_ADMIN_ENABLED;
});

test('canonical same-origin GET binds CSRF without Origin while cross-site reads fail', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    actual = configured;
    const read = new Request(`${origin}/admin/embeddings`);
    const response = await handleAdminRoute(read, session, id);
    expect(response?.status).toBe(200);
    expect((await response!.json()).csrf).toBe(csrfToken(id, origin));
    expect(response!.headers.get('Cache-Control')).toBe('no-store');
    for (const headers of [
        { 'Sec-Fetch-Site': 'cross-site' },
        { Origin: 'https://attacker.test' },
        { Origin: 'null' },
    ] as Record<string, string>[]) {
        expect(
            (await handleAdminRoute(new Request(read.url, { headers }), session, id))?.status
        ).toBe(403);
    }
    expect((await handleAdminRoute(read, { did: 'did:web:wrong' }, id))?.status).toBe(403);
});

test('repair endpoints permit no caller-selected owner or URI', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    const headers = {
        Origin: origin,
        'Content-Type': 'application/json',
        'X-Passport-CSRF': csrfToken(id, origin),
    };
    const base = '/admin/embeddings/legacy-repair/jobs';
    const send = (path: string, body: object) =>
        handleAdminRoute(
            new Request(`https://passport.example.test${path}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            }),
            session,
            id
        );
    expect((await send(base, { requestId: '11111111-1111-4111-8111-111111111111' }))?.status).toBe(
        201
    );
    for (const action of ['preview', 'verify']) {
        expect(
            (await send(`${base}/11111111-1111-4111-8111-111111111111/${action}`, {}))?.status
        ).toBe(200);
        expect(
            (
                await send(`${base}/11111111-1111-4111-8111-111111111111/${action}`, {
                    did: configured,
                })
            )?.status
        ).toBe(400);
        expect(
            (
                await send(`${base}/11111111-1111-4111-8111-111111111111/${action}`, {
                    uri: 'https://example.test',
                })
            )?.status
        ).toBe(400);
    }
});

test('batch routes require bounded explicit authorization and exact empty control bodies', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    actual = configured;
    const batch = '11111111-1111-4111-8111-111111111111';
    const send = (path: string, body: object) =>
        handleAdminRoute(
            new Request(`${origin}${path}`, {
                method: 'POST',
                headers: {
                    Origin: origin,
                    'Content-Type': 'application/json',
                    'X-Passport-CSRF': csrfToken(id, origin),
                },
                body: JSON.stringify(body),
            }),
            session,
            id
        );
    const body = {
        requestId: batch,
        jobId: batch,
        kind: 'apply',
        limit: 5,
        paidAuthorized: true,
    };
    expect((await send('/admin/embeddings/batches', body))?.status).toBe(200);
    for (const invalid of [
        { ...body, paidAuthorized: false },
        { ...body, limit: 101 },
        { ...body, did: configured },
    ])
        expect((await send('/admin/embeddings/batches', invalid))?.status).toBe(400);
    expect(
        (await send(`/admin/embeddings/batches/${batch}/advance`, { sequence: -1 }))?.status
    ).toBe(400);
    expect((await send(`/admin/embeddings/batches/${batch}/pause`, { sequence: 1 }))?.status).toBe(
        400
    );
    expect((await send(`/admin/embeddings/batches/${batch}/cancel`, {}))?.status).toBe(200);
});

test('coverage route remains fail-closed and returns only sanitized vector diagnostics', async () => {
    const { CoverageObservationError } = await import('./coverage-error');
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    actual = configured;
    const before = calls;
    try {
        coverageError = new CoverageObservationError(
            'vector-read',
            {
                status: 400,
                message: 'secret DID URI and payload',
                url: 'https://private-qdrant.example/secret',
                data: { error: 'secret payload' },
                headers: { Authorization: 'secret-token' },
            },
            { generation: 'nova1024v1', view: 'DOMAIN_SUMMARY' }
        );
        const response = await handleAdminRoute(
            new Request(`${origin}/admin/embeddings/coverage`, {
                headers: { Origin: origin },
            }),
            session,
            id
        );
        expect(response?.status).toBe(503);
        expect(response?.headers.get('Cache-Control')).toBe('no-store');
        const body = await response!.json();
        expect(body).toEqual({
            error: 'Coverage inventory unavailable',
            reason: 'Vector observation failed. Inventory observation unavailable; database/change-stream/vector checks failed',
            stage: 'vector-read',
            vector: {
                generation: 'nova1024v1',
                view: 'DOMAIN_SUMMARY',
                category: 'invalid_request',
                httpStatus: 400,
            },
        });
        expect(JSON.stringify(body)).not.toContain('secret');
        expect(calls).toBe(before);
        coverageError = new Error('secret');
        const unknown = await handleAdminRoute(
            new Request(`${origin}/admin/embeddings/coverage`, {
                headers: { Origin: origin },
            }),
            session,
            id
        );
        expect(unknown?.status).toBe(503);
        expect(await unknown!.json()).toEqual({
            error: 'Coverage inventory unavailable',
            reason: 'Inventory observation unavailable; database/change-stream/vector checks failed',
            stage: 'unknown',
        });
    } finally {
        coverageError = undefined;
        delete process.env.EMBEDDINGS_ADMIN_ENABLED;
    }
});

test('authenticated status exposes safe planning prices without executing paid work', async () => {
    const prior = {
        enabled: process.env.EMBEDDINGS_ADMIN_ENABLED,
        region: process.env.AWS_REGION,
        model: process.env.TITLE_MODEL,
    };
    const before = calls;
    try {
        process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
        process.env.AWS_REGION = 'us-east-1';
        process.env.TITLE_MODEL = 'unrecognized-private-model-value';
        const response = await handleAdminRoute(
            new Request(`${origin}/admin/embeddings`, {
                headers: { Origin: origin },
            }),
            session,
            id
        );
        expect(response?.status).toBe(200);
        const value = await response!.json();
        expect(value.pricing.generationModel).toBeNull();
        expect(value.pricing.generationInputUsdPerMillionTokens).toBeNull();
        expect(value.pricing.embeddingUsdPerMillionTokens).toBe(0.135);
        expect(JSON.stringify(value)).not.toContain('unrecognized-private-model-value');
        expect(calls).toBe(before);
    } finally {
        for (const [key, value] of Object.entries({
            EMBEDDINGS_ADMIN_ENABLED: prior.enabled,
            AWS_REGION: prior.region,
            TITLE_MODEL: prior.model,
        })) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
});

test('whole-run routes require exact immutable plan authorization and fresh start/resume proofs', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    actual = configured;
    currentSession = session;
    const requestId = '11111111-1111-4111-8111-111111111111';
    const send = (path: string, body: object, actor = session) =>
        handleAdminRoute(
            new Request(`${origin}${path}`, {
                method: 'POST',
                headers: {
                    Origin: origin,
                    'Content-Type': 'application/json',
                    'X-Passport-CSRF': csrfToken(id, origin),
                },
                body: JSON.stringify(body),
            }),
            actor,
            id
        );
    for (const path of [
        '/admin/embeddings/runs/plan',
        '/admin/embeddings/runs',
        `/admin/embeddings/runs/${requestId}/resume`,
    ]) {
        expect((await send(path, {}, { ...session, authenticatedAt: 1 }))?.status).toBe(401);
        expect((await send(path, {}, { ...session, did: 'did:key:foreign' }))?.status).toBe(403);
    }
    expect((await send('/admin/embeddings/runs/plan', { requestId }))?.status).toBe(200);
    for (const body of [
        { requestId, maxRecords: 100 },
        { requestId, did: configured },
        { requestId, snapshot: [] },
    ])
        expect((await send('/admin/embeddings/runs/plan', body))?.status).toBe(400);
    const start = { requestId, planId: requestId, paidAuthorized: true };
    for (const body of [
        { ...start, paidAuthorized: false },
        { ...start, maxGenerationRequests: 999 },
        { ...start, maxPrivacyRequests: 999 },
        { requestId, paidAuthorized: true },
    ])
        expect((await send('/admin/embeddings/runs', body))?.status).toBe(400);
    expect((await send('/admin/embeddings/runs', start))?.status).toBe(201);
    expect(runArguments.slice(0, 3)).toEqual([requestId, requestId, true]);
    expect(runArguments[4]).toBe(configured);
    await expect(runArguments[3]()).resolves.toBeUndefined();
    currentSession = null;
    await expect(runArguments[3]()).rejects.toThrow();
    currentSession = session;
    expect((await send(`/admin/embeddings/runs/${requestId}/resume`, {}))?.status).toBe(200);
    expect(runArguments[2]).toBe(configured);
});

test('only authenticated owner pause/cancel remains available after five-minute freshness expires', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    actual = configured;
    currentSession = session;
    const requestId = '11111111-1111-4111-8111-111111111111';
    for (const action of ['pause', 'cancel']) {
        const path = `/admin/embeddings/runs/${requestId}/${action}`;
        const send = (
            actor: typeof session | null,
            headers: Record<string, string> = {},
            body = {}
        ) =>
            handleAdminRoute(
                new Request(`${origin}${path}`, {
                    method: 'POST',
                    headers: {
                        Origin: origin,
                        'Content-Type': 'application/json',
                        'X-Passport-CSRF': csrfToken(id, origin),
                        ...headers,
                    },
                    body: JSON.stringify(body),
                }),
                actor,
                id
            );
        const stale = { ...session, authenticatedAt: 1 };
        expect((await send(stale))?.status).toBe(200);
        expect(runArguments).toEqual([requestId, action === 'cancel', configured]);
        expect((await send(null))?.status).toBe(401);
        expect((await send({ ...stale, did: 'did:key:foreign' }))?.status).toBe(403);
        expect((await send(stale, { Origin: 'https://evil.example' }))?.status).toBe(403);
        expect((await send(stale, { 'X-Passport-CSRF': 'invalid' }))?.status).toBe(403);
        expect((await send(stale, {}, { maxPrivacyRequests: 100 }))?.status).toBe(400);
        currentSession = null;
        const before = calls;
        expect((await send(stale))?.status).toBe(503);
        expect(calls).toBe(before);
        currentSession = { ...session, did: 'did:key:foreign' };
        expect((await send(stale))?.status).toBe(503);
        expect(calls).toBe(before);
        currentSession = session;
    }
});

test('review status is an authenticated owner read after freshness expires and never mutates', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    actual = configured;
    const requestId = '11111111-1111-4111-8111-111111111111';
    const read = (actor: typeof session | null, requestOrigin = origin) =>
        handleAdminRoute(
            new Request(`${origin}/admin/embeddings/runs/plan/${requestId}`, {
                headers: { Origin: requestOrigin },
            }),
            actor,
            id
        );
    const before = calls;
    const response = await read({ ...session, authenticatedAt: 1 });
    expect(response?.status).toBe(200);
    expect(await response?.json()).toEqual({
        state: 'preparing',
        processed: 1,
        total: 2,
    });
    expect((await read(null))?.status).toBe(401);
    expect((await read({ ...session, did: 'did:key:foreign' }))?.status).toBe(403);
    expect((await read(session, 'https://evil.example'))?.status).toBe(403);
    expect(calls).toBe(before);
});

test('metadata diagnosis requires trusted authenticated service principal and permits stale read without mutations', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    actual = configured;
    const read = (actor: typeof session | null, requestOrigin = origin) =>
        handleAdminRoute(
            new Request(`${origin}/admin/embeddings/metadata-diagnosis`, {
                headers: { Origin: requestOrigin },
            }),
            actor,
            id
        );
    const before = calls;
    const response = await read({ ...session, authenticatedAt: 1 });
    expect(response?.status).toBe(200);
    expect(await response?.json()).toEqual({ scanned: 2, excluded: 1 });
    expect((await read(null))?.status).toBe(401);
    expect((await read({ ...session, did: 'did:key:foreign' }))?.status).toBe(403);
    expect((await read(session, 'https://evil.example'))?.status).toBe(403);
    expect(calls).toBe(before);
});

test('whole workflow accepts only an optional bounded record limit and exact prior-run replacement', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    actual = configured;
    currentSession = session;
    const requestId = '11111111-1111-4111-8111-111111111111';
    const replaceRunId = '22222222-2222-4222-8222-222222222222';
    const send = (path: string, body: object) =>
        handleAdminRoute(
            new Request(`${origin}${path}`, {
                method: 'POST',
                headers: {
                    Origin: origin,
                    'Content-Type': 'application/json',
                    'X-Passport-CSRF': csrfToken(id, origin),
                },
                body: JSON.stringify(body),
            }),
            session,
            id
        );
    for (const recordLimit of [1, 10000]) {
        expect(
            (await send('/admin/embeddings/runs/plan', { requestId, recordLimit }))?.status
        ).toBe(200);
        expect(planArguments).toEqual([requestId, configured, recordLimit]);
    }
    for (const recordLimit of [0, -1, 10001, 1.5, '1', null])
        expect(
            (await send('/admin/embeddings/runs/plan', { requestId, recordLimit }))?.status
        ).toBe(400);
    const body = { requestId, planId: requestId, paidAuthorized: true, replaceRunId };
    expect((await send('/admin/embeddings/runs', body))?.status).toBe(201);
    expect(runArguments[5]).toBe(replaceRunId);
    for (const invalid of [null, 'other', 10])
        expect(
            (await send('/admin/embeddings/runs', { ...body, replaceRunId: invalid }))?.status
        ).toBe(400);
});

test('generation retry policy requires an exact fresh-authenticated Start or Resume opt-in', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    actual = configured;
    currentSession = session;
    const requestId = '11111111-1111-4111-8111-111111111111';
    const send = (path: string, body: object, actor = session) =>
        handleAdminRoute(
            new Request(`${origin}${path}`, {
                method: 'POST',
                headers: {
                    Origin: origin,
                    'Content-Type': 'application/json',
                    'X-Passport-CSRF': csrfToken(id, origin),
                },
                body: JSON.stringify(body),
            }),
            actor,
            id
        );
    const start = { requestId, planId: requestId, paidAuthorized: true };
    expect((await send('/admin/embeddings/runs', start))?.status).toBe(201);
    expect(runArguments[6]).toBeUndefined();
    expect(
        (await send('/admin/embeddings/runs', { ...start, generationRetryPolicy: 'http5xx-v1' }))
            ?.status
    ).toBe(201);
    expect(runArguments[6]).toBe('http5xx-v1');
    const resume = `/admin/embeddings/runs/${requestId}/resume`;
    expect((await send(resume, {}))?.status).toBe(200);
    expect(runArguments[3]).toBeUndefined();
    expect((await send(resume, { generationRetryPolicy: 'http5xx-v1' }))?.status).toBe(200);
    expect(runArguments[3]).toBe('http5xx-v1');
    expect(
        (await send('/admin/embeddings/runs', { ...start, generationRetryPolicy: 'transient-v2' }))
            ?.status
    ).toBe(201);
    expect(runArguments[6]).toBe('transient-v2');
    expect((await send(resume, { generationRetryPolicy: 'transient-v2' }))?.status).toBe(200);
    expect(runArguments[3]).toBe('transient-v2');
    for (const generationRetryPolicy of [null, true, 3, 'all', 'http5xx-v2', {}]) {
        expect(
            (await send('/admin/embeddings/runs', { ...start, generationRetryPolicy }))?.status
        ).toBe(400);
        expect((await send(resume, { generationRetryPolicy }))?.status).toBe(400);
    }
    for (const action of ['pause', 'cancel'])
        expect(
            (
                await send(`/admin/embeddings/runs/${requestId}/${action}`, {
                    generationRetryPolicy: 'http5xx-v1',
                })
            )?.status
        ).toBe(400);
    const stale = { ...session, authenticatedAt: 1 };
    expect(
        (
            await send(
                '/admin/embeddings/runs',
                { ...start, generationRetryPolicy: 'http5xx-v1' },
                stale
            )
        )?.status
    ).toBe(401);
    expect((await send(resume, { generationRetryPolicy: 'http5xx-v1' }, stale))?.status).toBe(401);
    expect(
        (await send(resume, { generationRetryPolicy: 'http5xx-v1', maxGenerationRequests: 100000 }))
            ?.status
    ).toBe(400);
});

test('exhausted Resume returns a fixed conflict response after existing auth and CSRF checks', async () => {
    const { EmbeddingResumeBlockedError } = await import('./embedding-recovery');
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    actual = configured;
    currentSession = session;
    resumeFailure = new EmbeddingResumeBlockedError(4296);
    try {
        const response = await handleAdminRoute(
            new Request(
                `${origin}/admin/embeddings/runs/11111111-1111-4111-8111-111111111111/resume`,
                {
                    method: 'POST',
                    headers: {
                        Origin: origin,
                        'Content-Type': 'application/json',
                        'X-Passport-CSRF': csrfToken(id, origin),
                    },
                    body: JSON.stringify({ generationRetryPolicy: 'transient-v2' }),
                }
            ),
            session,
            id
        );
        expect(response?.status).toBe(409);
        expect(await response?.json()).toMatchObject({
            code: 'embedding_attempts_exhausted',
            record: 4296,
        });
    } finally {
        resumeFailure = undefined;
    }
});

test('single-use recovery requires exact fixed paid caps under fresh service proof and CSRF', async () => {
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    currentSession = session;
    const path = '/admin/embeddings/runs/11111111-1111-4111-8111-111111111111/recover-once';
    const body = {
        requestId: '22222222-2222-4222-8222-222222222222',
        record: 4296,
        paidAuthorized: true,
        caps: { generation: 1, embedding: 5, privacy: 3 },
    };
    const request = (value: object) =>
        new Request(`${origin}${path}`, {
            method: 'POST',
            headers: {
                Origin: origin,
                'Content-Type': 'application/json',
                'X-Passport-CSRF': csrfToken(id, origin),
            },
            body: JSON.stringify(value),
        });
    expect((await handleAdminRoute(request(body), session, id))?.status).toBe(200);
    expect(runArguments[3]).toEqual(body);
    for (const invalid of [
        { ...body, caps: { generation: 2, embedding: 5, privacy: 3 } },
        { ...body, paidAuthorized: false },
        { ...body, record: 0 },
        { ...body, did: configured },
        { ...body, caps: { ...body.caps, extra: 1 } },
    ])
        expect((await handleAdminRoute(request(invalid), session, id))?.status).toBe(400);
});
