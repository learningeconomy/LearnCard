import { test, expect } from 'bun:test';
import {
    CoverageObservationError,
    coverageFailureReason,
    coverageVectorFailure,
    observeCoverageStage,
} from './coverage-error';
test('observer failures disclose static categories and never raw messages or credential data', () => {
    for (const e of [
        { code: 13 },
        { code: 40573 },
        { code: 280 },
        { code: 50 },
        { name: 'MongoNetworkTimeoutError' },
        {},
        null,
    ]) {
        const reason = coverageFailureReason(
            e && { ...e, message: 'secret learner URI bearer-token' }
        );
        expect(reason).not.toContain('secret');
        expect(reason).not.toContain('bearer');
    }
    expect(coverageFailureReason({ code: 13 })).toContain('authorization');
    expect(coverageFailureReason({ code: 40573 })).toContain('change streams');
    expect(coverageFailureReason({ message: 'Incompatible coverage vector schema' })).toContain(
        'schema incompatible'
    );
});

test('stage diagnostics preserve only finite categories and never underlying payloads', async () => {
    const { observeCoverageStage, coverageFailureStage } = await import('./coverage-error');
    for (const stage of [
        'database',
        'source-read',
        'change-stream',
        'vector-schema',
        'vector-read',
        'owner-fence',
    ] as const) {
        try {
            await observeCoverageStage(stage, async () => {
                throw {
                    name: 'PrivateError',
                    message: 'secret learner DID token URL',
                    request: { Authorization: 'secret-token' },
                };
            });
        } catch (error) {
            expect(coverageFailureStage(error)).toBe(stage);
            expect(coverageFailureReason(error)).toContain('failed');
            expect(coverageFailureReason(error)).not.toContain('secret');
            expect(coverageFailureReason(error)).not.toContain('PrivateError');
        }
    }
    expect(coverageFailureStage({ stage: 'secret' })).toBe('unknown');
    expect(await observeCoverageStage('database', async () => 42)).toBe(42);
});

const privateCause = {
    message: 'secret learner DID URI bearer-token',
    url: 'https://private-qdrant.example/collection-secret',
    data: { status: { error: 'secret payload' } },
    headers: { Authorization: 'secret-token' },
};
const vectorContext = { generation: 'nova1024v1', view: 'KEY_CLAIMS' };

test('vector diagnostics allow only numeric HTTP statuses and static categories', () => {
    const cases = [
        [400, 'invalid_request'],
        [401, 'authorization'],
        [403, 'authorization'],
        [404, 'not_found'],
        [408, 'timeout'],
        [409, 'conflict'],
        [422, 'invalid_request'],
        [429, 'rate_limited'],
        [500, 'unavailable'],
        [502, 'unavailable'],
        [503, 'unavailable'],
        [504, 'timeout'],
    ] as const;
    for (const [status, category] of cases) {
        const error = new CoverageObservationError(
            'vector-read',
            { ...privateCause, status },
            vectorContext
        );
        expect(coverageVectorFailure(error)).toEqual({
            ...vectorContext,
            category,
            httpStatus: status,
        });
        expect(JSON.stringify(coverageVectorFailure(error))).not.toContain('secret');
    }
    for (const status of [
        '403',
        '403 secret',
        200,
        418,
        600,
        NaN,
        Infinity,
        400.1,
        {},
        null,
        undefined,
    ]) {
        expect(
            coverageVectorFailure(
                new CoverageObservationError(
                    'vector-read',
                    { ...privateCause, status },
                    vectorContext
                )
            )
        ).toEqual({ ...vectorContext, category: 'unknown' });
    }
});

test('vector transport diagnostics never echo arbitrary names, codes or nested bodies', () => {
    for (const cause of [
        { name: 'AbortError' },
        { name: 'TimeoutError' },
        { name: 'QdrantClientTimeoutError' },
        { code: 'ETIMEDOUT' },
        { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } },
        { code: 'UND_ERR_HEADERS_TIMEOUT' },
        { code: 'UND_ERR_BODY_TIMEOUT' },
    ]) {
        expect(
            coverageVectorFailure(
                new CoverageObservationError(
                    'vector-read',
                    { ...privateCause, ...cause },
                    vectorContext
                )
            )
        ).toEqual({ ...vectorContext, category: 'timeout' });
    }
    for (const code of ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN']) {
        expect(
            coverageVectorFailure(
                new CoverageObservationError(
                    'vector-read',
                    { ...privateCause, cause: { code } },
                    vectorContext
                )
            )
        ).toEqual({ ...vectorContext, category: 'network' });
    }
    for (const cause of [
        null,
        undefined,
        'secret',
        13,
        {
            ...privateCause,
            name: 'SecretError',
            code: 'secret',
            cause: { code: 'secret', status: 403 },
        },
    ]) {
        expect(
            coverageVectorFailure(new CoverageObservationError('vector-read', cause, vectorContext))
        ).toEqual({ ...vectorContext, category: 'unknown' });
    }
});

test('vector context is allowlisted and scoped to vector stages', async () => {
    for (const generation of ['openai1536', 'nova1024v1']) {
        for (const view of [
            'FULL_TEXT',
            'DOMAIN_SUMMARY',
            'KEY_CLAIMS',
            'TECHNICAL_METADATA',
            'COMPARISON_CONTEXT',
        ]) {
            for (const stage of ['vector-schema', 'vector-read'] as const) {
                let caught: unknown;
                try {
                    await observeCoverageStage(
                        stage,
                        async () => {
                            throw { ...privateCause, status: 403 };
                        },
                        { generation, view }
                    );
                } catch (error) {
                    caught = error;
                }
                expect(caught).toBeInstanceOf(CoverageObservationError);
                expect(coverageVectorFailure(caught)).toEqual({
                    generation,
                    view,
                    category: 'authorization',
                    httpStatus: 403,
                });
            }
        }
    }
    for (const context of [
        undefined,
        { generation: 'secret', view: 'prefix__credential_full_text_secret' },
    ]) {
        expect(
            coverageVectorFailure(
                new CoverageObservationError('vector-read', privateCause, context)
            )
        ).toEqual({ generation: 'unknown', view: 'unknown', category: 'unknown' });
    }
    for (const stage of ['database', 'source-read', 'change-stream', 'owner-fence'] as const) {
        expect(
            coverageVectorFailure(
                new CoverageObservationError(stage, { status: 403 }, vectorContext)
            )
        ).toBeUndefined();
    }
    expect(
        coverageVectorFailure({
            stage: 'vector-read',
            cause: privateCause,
            vectorContext,
        })
    ).toBeUndefined();
    expect(await observeCoverageStage('vector-read', async () => 42, vectorContext)).toBe(42);
});

test('Qdrant SDK resource exhaustion keeps only its static rate-limit category', () => {
    expect(
        coverageVectorFailure(
            new CoverageObservationError(
                'vector-read',
                {
                    ...privateCause,
                    name: 'QdrantClientResourceExhaustedError',
                    retry_after: 'secret',
                },
                vectorContext
            )
        )
    ).toEqual({ ...vectorContext, category: 'rate_limited' });
});
